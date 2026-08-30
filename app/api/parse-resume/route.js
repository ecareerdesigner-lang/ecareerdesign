import mammoth from "mammoth";
import { logError } from "@/lib/logError.js";

export const runtime = "nodejs";

const MAX_OCR_PAGES = 5;

async function extractPdfImages(buffer) {
  const { PDFDocument, PDFName, PDFRawStream, PDFDict } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const images = [];
  for (const page of pdfDoc.getPages()) {
    const resources = page.node.Resources();
    if (!resources) continue;
    const xObject = resources.lookup(PDFName.of("XObject"));
    if (!(xObject instanceof PDFDict)) continue;
    for (const key of xObject.keys()) {
      const obj = xObject.lookup(key);
      if (obj instanceof PDFRawStream) {
        const filter = obj.dict.get(PDFName.of("Filter"));
        const subtype = obj.dict.get(PDFName.of("Subtype"));
        if (filter?.toString() === "/DCTDecode" && subtype?.toString() === "/Image") {
          images.push(Buffer.from(obj.contents));
        }
      }
    }
  }
  return images;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file) {
      return Response.json({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || "";
    const lower = filename.toLowerCase();

    let text = "";
    if (lower.endsWith(".pdf") || file.type === "application/pdf") {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      text = (data.text || "").trim();

      if (!text) {
        // No text layer — likely a scanned/image-only PDF. Hand the page images
        // back to the browser to OCR itself (tesseract.js's Node worker_threads
        // path hangs indefinitely inside Vercel's serverless functions, but the
        // browser's real Web Worker support works fine).
        const images = await extractPdfImages(buffer);
        if (images.length > 0) {
          return Response.json({
            needsOcr: true,
            images: images.slice(0, MAX_OCR_PAGES).map((img) => img.toString("base64")),
          });
        }
      }
    } else if (lower.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return Response.json({ error: "Unsupported file type. Please upload a PDF or Word (.docx) file." }, { status: 400 });
    }

    text = (text || "").trim();
    if (!text) {
      await logError({ source: "server", feature: "parse-resume", message: "Could not extract any text from this file.", context: { filename } });
      return Response.json({ error: "Could not extract any text from this file." }, { status: 400 });
    }

    return Response.json({ text: text.slice(0, 15000) });
  } catch (e) {
    console.error("parse-resume failed:", e);
    await logError({ source: "server", feature: "parse-resume", message: e.message, stack: e.stack });
    return Response.json({ error: "Could not read this file. Try a different format or file." }, { status: 500 });
  }
}

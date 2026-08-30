import path from "path";
import mammoth from "mammoth";
import { logError } from "@/lib/logError.js";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_OCR_PAGES = 5;
const TESSDATA_PATH = path.join(process.cwd(), "public", "tessdata");

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

async function ocrPdfImages(images) {
  const { createWorker } = await import("tesseract.js");
  // langPath points at a locally bundled trained-data file so the worker never
  // fetches from the jsdelivr CDN at request time — that runtime fetch was
  // stalling long enough on Vercel to hit the function\'s 60s timeout.
  const worker = await createWorker("eng", 1, {
    langPath: TESSDATA_PATH,
    gzip: true,
    cacheMethod: "none",
    logger: () => {},
  });
  let text = "";
  try {
    for (const img of images.slice(0, MAX_OCR_PAGES)) {
      const { data } = await worker.recognize(img);
      text += data.text + "\n\n";
    }
  } finally {
    await worker.terminate();
  }
  return text.trim();
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
        const images = await extractPdfImages(buffer);
        if (images.length > 0) {
          text = await ocrPdfImages(images);
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

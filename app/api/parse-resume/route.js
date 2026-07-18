import mammoth from "mammoth";

export const runtime = "nodejs";

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
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (lower.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return Response.json({ error: "Unsupported file type. Please upload a PDF or Word (.docx) file." }, { status: 400 });
    }

    text = (text || "").trim();
    if (!text) {
      return Response.json({ error: "Could not extract any text from this file." }, { status: 400 });
    }

    return Response.json({ text: text.slice(0, 15000) });
  } catch (e) {
    console.error("parse-resume failed:", e);
    return Response.json({ error: "Could not read this file. Try a different format or file." }, { status: 500 });
  }
}
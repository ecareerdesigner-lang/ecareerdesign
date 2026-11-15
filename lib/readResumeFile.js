// Browser helper used by the public resume tools. Sends the file to /api/parse-resume and returns
// the resume text. The server hands back page images (needsOcr) for picture-only PDFs, such as
// the PDFs eCareer Design itself used to export, scans, and PDFs saved from a screenshot; those are
// read here with in-browser OCR. Never returns empty or near-empty text: callers can score the result safely.

export const MIN_RESUME_CHARS = 120;

async function ocrImagesInBrowser(base64Images) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { langPath: "/tessdata", gzip: true, cacheMethod: "none" });
  let text = "";
  try {
    for (const b64 of base64Images) {
      const { data } = await worker.recognize(`data:image/jpeg;base64,${b64}`);
      text += data.text + "\n\n";
    }
  } finally {
    await worker.terminate();
  }
  return text.trim();
}

export async function readResumeFile(file, { onOcrStart } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Could not read this file.");

  let text = data.text;
  if (data.needsOcr) {
    if (onOcrStart) onOcrStart();
    try {
      text = await ocrImagesInBrowser(data.images || []);
    } catch (e) {
      console.warn("[readResumeFile] OCR failed", e);
      throw new Error("We couldn't read the text in this PDF. Try the Word (.docx) version, or a PDF saved directly from your word processor.");
    }
  }

  text = (text || "").trim();
  if (text.length < MIN_RESUME_CHARS) {
    throw new Error(
      data.needsOcr
        ? "We couldn't read the text in this PDF. Try a clearer copy, or upload the Word (.docx) version."
        : "We couldn't find enough text in this file to score. Try the Word (.docx) version, or a PDF saved directly from your word processor."
    );
  }
  return text;
}

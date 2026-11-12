import { PDFDocument, StandardFonts } from "pdf-lib";
import { admin, authExtension, cors, HttpError, json, preflight, premiumGate, safe } from "@/lib/extension/auth";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

// Renders the tailored resume as a plain, single-column, text-based PDF.
// That is deliberately simple: it parses cleanly in every ATS. If you want your
// branded templates here, replace this with your existing renderer.
export const GET = safe("resume-pdf", async (req, ctx) => {
  const a = await authExtension(req);
  if (!a) throw new HttpError(401, "Not connected.");
  const gate = await premiumGate(a.userId);
  if (gate) return gate;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(String(id))) throw new HttpError(404, "Not found.");
  const userId = a.userId;

  const { data } = await admin()
    .from("extension_applications")
    .select("tailored_resume, job_title")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || !data.tailored_resume) throw new HttpError(404, "Not found.");

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const size = 10.5, lead = 14, margin = 54, width = 612 - margin * 2;
  let page = pdf.addPage([612, 792]);
  let y = 792 - margin;

  const wrap = (line, f) => {
    const words = line.split(/\s+/);
    const out = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (f.widthOfTextAtSize(t, size) > width && cur) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  };

  for (const raw of data.tailored_resume.replace(/\r/g, "").split("\n")) {
    const isHead = /^[A-Z][A-Z &/]{3,}$/.test(raw.trim());
    for (const l of wrap(raw.replace(/[^\x20-\x7E -ÿ]/g, ""), isHead ? bold : font)) {
      if (y < margin) { page = pdf.addPage([612, 792]); y = 792 - margin; }
      page.drawText(l, { x: margin, y, size, font: isHead ? bold : font });
      y -= lead;
    }
  }

  const bytes = await pdf.save();
  const res = new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="resume.pdf"',
    },
  });
  return cors(res);
});

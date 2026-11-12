import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { admin, authExtension, cors, HttpError, json, preflight, premiumGate, safe } from "@/lib/extension/auth";
import { loadApplicant } from "@/lib/extension/profile";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

// Plain-ASCII text only. Standard PDF fonts cannot draw every symbol, and a missing glyph shows up as a gap, so
// bullets, curly quotes and long dashes are swapped for the plain characters every application system reads.
const plain = (t) =>
  String(t || "")
    .replace(/[•●▪◦‣⁃·]/g, "-")
    .replace(/[–—−]/g, "-")
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/…/g, "...")
    .replace(/[    ]/g, " ")
    .replace(/[^\x20-\x7E]/g, "");

// Renders the tailored resume as a conventional one-column resume: name and contact line, section headings with a
// thin rule, bold job lines, bulleted achievements. Real text, no images, tables or columns, so it parses cleanly
// in every applicant tracking system.
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

  const me = await loadApplicant(userId).catch(() => null);
  const ap = (me && me.applicant) || {};
  const fullName = plain((me && me.fullName) || "").trim();
  const fileBase = fullName.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const contact = [[ap.city, ap.state].filter(Boolean).join(", "), ap.phone, ap.email, ap.linkedin]
    .map((x) => plain(x).trim())
    .filter(Boolean)
    .join("  |  ");

  const pdf = await PDFDocument.create();
  pdf.setTitle(fullName ? `${fullName} - Resume` : "Resume");
  if (fullName) pdf.setAuthor(fullName);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 612, H = 792, M = 54, CW = W - M * 2;
  const BODY = 10.5, LEAD = 13.5, INK = rgb(0.08, 0.08, 0.08), RULE = rgb(0.6, 0.6, 0.6);
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const need = (h) => { if (y - h < M) newPage(); };
  const wrap = (text, f, size, width) => {
    const out = [];
    let cur = "";
    for (const w of text.split(/\s+/).filter(Boolean)) {
      const t = cur ? cur + " " + w : w;
      if (f.widthOfTextAtSize(t, size) > width && cur) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  };
  const centered = (text, f, size) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: Math.max(M, (W - w) / 2), y, size, font: f, color: INK });
  };

  // ---- header: name and contact line ----
  if (fullName) {
    centered(fullName, bold, 20);
    y -= 22;
  }
  if (contact) {
    for (const l of wrap(contact, font, 9.5, CW)) { centered(l, font, 9.5); y -= 12.5; }
  }
  if (fullName || contact) {
    y -= 2;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.8, color: RULE });
    y -= 6;
  }

  // ---- body ----
  for (const raw of data.tailored_resume.replace(/\r/g, "").split("\n")) {
    const line = plain(raw).trim();
    if (!line) { y -= 4; continue; }

    if (/^[A-Z][A-Z &/,-]{2,}:?$/.test(line)) {
      // section heading
      need(LEAD * 3 + 10);
      y -= 8;
      page.drawText(line.replace(/:$/, ""), { x: M, y, size: 11, font: bold, color: INK });
      y -= 4;
      page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: RULE });
      y -= LEAD;
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      const indent = 14;
      const lines = wrap(bullet[1], font, BODY, CW - indent);
      need(LEAD * Math.min(lines.length, 2));
      lines.forEach((l, i) => {
        if (y < M) newPage();
        if (i === 0) page.drawText("•", { x: M + 3, y, size: BODY, font, color: INK });
        page.drawText(l, { x: M + indent, y, size: BODY, font, color: INK });
        y -= LEAD;
      });
      continue;
    }

    // job line "Title | Employer | City | Dates": title in bold, the rest regular
    const parts = line.split(/\s*\|\s*/);
    if (parts.length >= 2 && parts.length <= 5) {
      need(LEAD * 2);
      y -= 3;
      const head = parts[0];
      const rest = "  |  " + parts.slice(1).join("  |  ");
      const hw = bold.widthOfTextAtSize(head, BODY);
      if (hw + font.widthOfTextAtSize(rest, BODY) <= CW) {
        page.drawText(head, { x: M, y, size: BODY, font: bold, color: INK });
        page.drawText(rest, { x: M + hw, y, size: BODY, font, color: INK });
        y -= LEAD;
      } else {
        for (const l of wrap(line, bold, BODY, CW)) {
          if (y < M) newPage();
          page.drawText(l, { x: M, y, size: BODY, font: bold, color: INK });
          y -= LEAD;
        }
      }
      continue;
    }

    for (const l of wrap(line, font, BODY, CW)) {
      if (y < M) newPage();
      page.drawText(l, { x: M, y, size: BODY, font, color: INK });
      y -= LEAD;
    }
  }

  const bytes = await pdf.save();
  const res = new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileBase ? fileBase + "-Resume" : "Resume"}.pdf"`,
    },
  });
  return cors(res);
});

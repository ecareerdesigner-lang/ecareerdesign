"use client";

import { useRef, useState } from "react";
import { Download, Copy, Mail, Check, Loader2 } from "lucide-react";
import { TOKENS } from "@/lib/design-tokens.js";
import { formatReviewAsText } from "@/lib/performance-review-format.js";
import { ReviewPreview } from "./ReviewPreview.jsx";

// Builds a PDF from the given DOM element - same html2canvas + jsPDF
// approach used across Resume Builder, Cover Letter, and Interview Prep
// exports in components/ECareerDesign.jsx.
async function buildPdfFromElement(element) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const MAX_CANVAS_DIMENSION = 20000;
  if (!canvas.width || !canvas.height || canvas.height > MAX_CANVAS_DIMENSION || canvas.width > MAX_CANVAS_DIMENSION) {
    throw new Error(`Captured content looks invalid: ${canvas.width}x${canvas.height}px. Please try again.`);
  }

  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const scaledHeight = (canvas.height * pageWidth) / canvas.width;

  if (scaledHeight <= pageHeight) {
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, scaledHeight);
  } else {
    const pageHeightPx = Math.max(1, Math.floor((canvas.width * pageHeight) / pageWidth));
    const MAX_PAGES = 30;
    let renderedPx = 0;
    let pageIndex = 0;
    while (renderedPx < canvas.height && pageIndex < MAX_PAGES) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const ctx = pageCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      if (pageIndex > 0) pdf.addPage();
      const sliceHeightPt = (sliceHeightPx * pageWidth) / canvas.width;
      pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidth, sliceHeightPt);

      pageCanvas.width = 0;
      pageCanvas.height = 0;
      renderedPx += sliceHeightPx;
      pageIndex += 1;
    }
  }

  return pdf;
}

export function ExportSection({ review }) {
  const previewRef = useRef(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailPdfWarning, setEmailPdfWarning] = useState("");

  const filename = `performance_review_${review.review_period}.pdf`;

  async function downloadPdf() {
    if (!previewRef.current) return;
    setPdfGenerating(true);
    setPdfError("");
    try {
      const pdf = await buildPdfFromElement(previewRef.current);
      pdf.save(filename);
    } catch (e) {
      setPdfError("Could not generate the PDF. Try again, or use Copy as text instead.");
    } finally {
      setPdfGenerating(false);
    }
  }

  async function copyAsText() {
    try {
      await navigator.clipboard.writeText(formatReviewAsText(review));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setPdfError("Could not copy to clipboard.");
    }
  }

  async function emailMeACopy() {
    if (!email.trim()) return;
    setEmailSending(true);
    setEmailError("");
    setEmailPdfWarning("");
    let pdfBase64 = null;
    let pdfFailReason = null;

    try {
      if (previewRef.current) {
        const pdf = await buildPdfFromElement(previewRef.current);
        pdfBase64 = pdf.output("datauristring").split(",")[1];
      }
    } catch (e) {
      pdfFailReason = e?.message || String(e);
      pdfBase64 = null;
    }

    const MAX_PDF_BASE64_CHARS = 3_000_000;
    if (pdfBase64 && pdfBase64.length > MAX_PDF_BASE64_CHARS) {
      pdfFailReason = "The generated PDF was too large to email.";
      pdfBase64 = null;
    }

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          optIn,
          content: formatReviewAsText(review),
          contentType: "Performance Review",
          pdfBase64,
          pdfFilename: pdfBase64 ? filename : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSent(true);
        if (!pdfBase64) {
          setEmailPdfWarning(`Sent as text only — the PDF wasn't included. ${pdfFailReason || ""}`);
        }
      } else {
        setEmailError(data.error || "Could not send. Try again.");
      }
    } catch (e) {
      setEmailError("Could not send. Try again.");
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, margin: "0 0 4px", color: TOKENS.ink }}>
        Export
      </h2>
      <p style={{ fontSize: 14, color: TOKENS.inkSoft, margin: "0 0 16px" }}>
        Download a PDF, copy the text, or email yourself a copy.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pdfGenerating}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: TOKENS.accent, color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600,
            cursor: pdfGenerating ? "default" : "pointer", opacity: pdfGenerating ? 0.7 : 1,
          }}
        >
          {pdfGenerating ? <Loader2 size={16} className="cf-spin" /> : <Download size={16} />}
          {pdfGenerating ? "Generating..." : "Download PDF"}
        </button>

        <button
          type="button"
          onClick={copyAsText}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: TOKENS.surface, color: TOKENS.ink, border: `1px solid ${TOKENS.line}`,
            borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          {copied ? <Check size={16} color={TOKENS.green} /> : <Copy size={16} />}
          {copied ? "Copied!" : "Copy as text"}
        </button>
      </div>

      {pdfError && <p style={{ color: TOKENS.red, fontSize: 13, marginBottom: 16 }}>{pdfError}</p>}

      <div style={{ border: `1px solid ${TOKENS.accent}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Mail size={18} color={TOKENS.accent} />
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, margin: 0, color: TOKENS.ink }}>
            Email me a copy
          </h3>
        </div>
        <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 14px" }}>
          We'll send your review straight to your inbox, as a PDF.
        </p>

        {emailSent ? (
          <p style={{ fontSize: 14, color: TOKENS.green, fontWeight: 600, margin: 0 }}>
            ✓ Sent! Check your inbox.
            {emailPdfWarning && (
              <span style={{ display: "block", fontWeight: 400, color: TOKENS.inkSoft, marginTop: 4 }}>
                {emailPdfWarning}
              </span>
            )}
          </p>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  flex: "1 1 220px", padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${TOKENS.line}`, fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={emailMeACopy}
                disabled={emailSending || !email.trim()}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: TOKENS.accent, color: "#fff", border: "none",
                  borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600,
                  cursor: emailSending ? "default" : "pointer", opacity: emailSending || !email.trim() ? 0.6 : 1,
                }}
              >
                {emailSending ? <Loader2 size={16} className="cf-spin" /> : <Mail size={16} />}
                {emailSending ? "Sending..." : "Email it to me"}
              </button>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TOKENS.inkSoft }}>
              <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
              Also send me occasional updates about new eCareer Design features
            </label>
            {emailError && <p style={{ color: TOKENS.red, fontSize: 13, marginTop: 8 }}>{emailError}</p>}
          </>
        )}
      </div>

      <ReviewPreview ref={previewRef} review={review} />
    </div>
  );
}

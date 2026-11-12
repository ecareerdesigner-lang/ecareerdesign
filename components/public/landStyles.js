// Restyled copies of the inline `styles` keys used by the federal-resume-builder and
// cover-letter-generator pages. Only used when NEXT_PUBLIC_NEW_PUBLIC_PAGES=1.
const SERIF = "var(--np-display), Georgia, serif";
const INK = "#16283D", SOFT = "#3C5069", LINE = "#D7DBD6", OR = "#F2660A", ORINK = "#B34700", SOFTOR = "#FDE3CC";
const lab = { fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" };

export const landStyles = {
  alertCard: { background: SOFTOR, border: "1px solid #F3C9A4", borderRadius: 20, padding: "1.5rem 1.75rem", margin: "0 0 8px" },
  alertLabel: { ...lab, color: ORINK, margin: "0 0 8px" },
  alertText: { fontSize: 16, color: INK, margin: 0, lineHeight: 1.65 },
  h2: { fontFamily: SERIF, fontSize: 32, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.12, margin: "64px 0 18px", color: INK },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 },
  card: { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: "1.5rem", boxShadow: "0 1px 2px rgba(13,26,43,0.04), 0 14px 32px -24px rgba(13,26,43,0.35)" },
  stepNum: { ...lab, color: ORINK, margin: "0 0 8px" },
  cardTitle: { fontFamily: SERIF, fontSize: 20, fontWeight: 600, margin: "0 0 6px", color: INK },
  cardBody: { fontSize: 15, color: SOFT, margin: 0, lineHeight: 1.6 },
  list: { fontSize: 16.5, color: SOFT, lineHeight: 1.8, paddingLeft: 22, margin: 0 },
  faqItem: { borderTop: `1px solid ${LINE}`, padding: "18px 0" },
  faqQ: { fontSize: 17, fontWeight: 600, margin: "0 0 6px", color: INK },
  faqA: { fontSize: 15.5, color: SOFT, margin: 0, lineHeight: 1.65 },
  ctaCard: { background: INK, borderRadius: 24, padding: "2.5rem", margin: "64px 0 32px" },
  ctaEyebrow: { ...lab, color: OR, margin: "0 0 10px" },
  ctaHeading: { fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: "#fff", margin: "0 0 22px", lineHeight: 1.15, letterSpacing: "-0.015em" },
  button: { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, background: OR, color: "#0D1A2B", fontSize: 15, fontWeight: 600, padding: "10px 26px", borderRadius: 999, textDecoration: "none" },
  relatedLine: { fontSize: 15.5, color: SOFT, marginTop: 8 },
  relatedLink: { color: ORINK, fontWeight: 600, textDecoration: "underline" },
  heroSample: { background: "#fff", border: "1px solid #F3C9A4", borderRadius: 20, padding: "1.25rem 1.5rem", marginBottom: 8 },
  heroSampleLabel: { ...lab, color: ORINK, margin: "0 0 8px" },
  heroSampleText: { fontSize: 16, color: INK, fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.65 },
  heroSampleCaption: { fontSize: 13.5, color: SOFT, margin: 0 },
  compareGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  compareCardWeak: { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 20, padding: "1.5rem" },
  compareCardStrong: { background: "#fff", border: `2px solid ${OR}`, borderRadius: 20, padding: "1.5rem", boxShadow: "0 14px 32px -24px rgba(13,26,43,0.35)" },
  compareLabel: { ...lab, marginBottom: 10 },
  compareLabelWeak: { color: SOFT },
  compareLabelStrong: { color: ORINK },
  compareText: { fontSize: 15.5, color: INK, fontStyle: "italic", margin: 0, lineHeight: 1.65 },
};

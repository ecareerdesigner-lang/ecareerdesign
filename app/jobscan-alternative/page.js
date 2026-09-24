import Link from "next/link";

export const metadata = {
  title: "Jobscan Alternative: eCareer Design - $9.99/mo vs $49.95/mo",
  description:
    "Looking for a cheaper Jobscan alternative? eCareer Design gives you an ATS resume score, AI resume builder, job tailoring, cover letters, interview coaching, and job search for $9.99/mo - about 5x less than Jobscan Premium.",
  alternates: { canonical: "https://www.ecareerdesign.net/jobscan-alternative" },
  openGraph: {
    title: "A Jobscan Alternative That Costs 5x Less",
    description:
      "Same job: beat the ATS and land interviews. eCareer Design Premium is $9.99/mo. Jobscan Premium is $49.95/mo.",
    url: "https://www.ecareerdesign.net/jobscan-alternative",
    siteName: "eCareer Design",
    type: "website",
  },
};

const TOKENS = {
  ink: "#16283D",
  inkSoft: "#3C5069",
  paper: "#EEF0EC",
  surface: "#FFFFFF",
  line: "#D7DBD6",
  accent: "#F2660A",
  accentSoft: "#FDE3CC",
  green: "#2F6F4E",
  shadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px rgba(16,24,40,0.07)",
};

const serif = "'Fraunces', Georgia, serif";
const sans = "'Inter', -apple-system, Segoe UI, Roboto, sans-serif";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does Jobscan cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jobscan Premium costs $49.95 per month, or $89.95 every three months (about $29.98 per month). Its free plan includes about 5 resume scans per month. Prices checked September 24, 2026.",
      },
    },
    {
      "@type": "Question",
      name: "What is a cheaper alternative to Jobscan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "eCareer Design Premium is $9.99 per month - about 5x less than Jobscan's monthly plan. It includes a resume match score, AI resume builder, job tailoring, cover letter generation, interview coaching, and job search.",
      },
    },
    {
      "@type": "Question",
      name: "Can I check my resume's ATS score for free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. eCareer Design's free ATS score checker scores your resume in about 30 seconds - overall score, ATS score, keyword score, and formatting score - with no account required.",
      },
    },
    {
      "@type": "Question",
      name: "What does Jobscan do better than eCareer Design?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jobscan's per-job Match Rate report and ATS-specific advice (Workday, Greenhouse, Taleo and others) are the deepest in the category, and it offers LinkedIn profile optimization. If you need that single depth and budget is not a concern, Jobscan is a strong tool. If you want the whole job-search toolkit at a lower price, eCareer Design covers more of the search for less.",
      },
    },
  ],
};

function Row({ label, ecareer, jobscan }) {
  return (
    <tr>
      <td style={{ padding: "12px 14px", borderTop: `1px solid ${TOKENS.line}`, fontSize: 14.5, color: TOKENS.ink, fontWeight: 600 }}>{label}</td>
      <td style={{ padding: "12px 14px", borderTop: `1px solid ${TOKENS.line}`, fontSize: 14.5, color: TOKENS.inkSoft, background: TOKENS.accentSoft }}>{ecareer}</td>
      <td style={{ padding: "12px 14px", borderTop: `1px solid ${TOKENS.line}`, fontSize: 14.5, color: TOKENS.inkSoft }}>{jobscan}</td>
    </tr>
  );
}

export default function JobscanAlternativePage() {
  return (
    <div style={{ fontFamily: sans, background: TOKENS.paper, minHeight: "100vh", color: TOKENS.ink }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <header style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontFamily: serif, fontWeight: 600, fontSize: 20, color: TOKENS.ink, textDecoration: "none" }}>
          eCareer Design
        </Link>
        <Link href="/?view=auth" style={{ fontSize: 14.5, fontWeight: 600, color: TOKENS.accent, textDecoration: "none" }}>
          Sign in
        </Link>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 64px" }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accent, textTransform: "uppercase", margin: "0 0 10px" }}>
          Jobscan alternative
        </p>
        <h1 style={{ fontFamily: serif, fontWeight: 600, fontSize: 40, lineHeight: 1.18, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          The Jobscan alternative that costs 5x less
        </h1>
        <p style={{ fontSize: 18, color: TOKENS.inkSoft, maxWidth: 680, margin: "0 0 12px", lineHeight: 1.6 }}>
          Jobscan Premium is $49.95/mo. eCareer Design Premium is $9.99/mo - with an ATS resume score, AI resume builder, job tailoring, cover letters, interview coaching, and job search in one place.
        </p>
        <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 36px" }}>
          Competitor prices checked September 24, 2026 on Jobscan's plan page and current reviews.
        </p>

        <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, boxShadow: TOKENS.shadow, padding: "8px 18px 18px", marginBottom: 40, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "14px", fontSize: 13, color: TOKENS.inkSoft, fontWeight: 600 }}></th>
                <th style={{ textAlign: "left", padding: "14px", fontSize: 14, color: TOKENS.ink, fontWeight: 700, background: TOKENS.accentSoft }}>eCareer Design</th>
                <th style={{ textAlign: "left", padding: "14px", fontSize: 14, color: TOKENS.ink, fontWeight: 700 }}>Jobscan</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Price" ecareer="$9.99/mo" jobscan="$49.95/mo (or $89.95/quarter)" />
              <Row label="Free plan" ecareer="Resume builder, job tailoring, cover letter, job search - plus a free ATS score with no account" jobscan="About 5 resume scans/month" />
              <Row label="ATS resume score" ecareer="Free score plus Premium match scoring against any posting" jobscan="Match Rate report (deepest in category)" />
              <Row label="AI resume builder" ecareer="Included free" jobscan="Premium" />
              <Row label="Cover letters" ecareer="Included free" jobscan="Premium" />
              <Row label="Interview coaching" ecareer="Included in Premium - mock interviews with AI scoring" jobscan="Not offered" />
              <Row label="Job search" ecareer="Built in - real postings from USAJOBS, Adzuna & Jooble" jobscan="Job tracker only" />
            </tbody>
          </table>
        </div>

        <h2 style={{ fontFamily: serif, fontSize: 24, margin: "0 0 12px", color: TOKENS.ink }}>
          Where Jobscan still wins
        </h2>
        <p style={{ fontSize: 15.5, color: TOKENS.inkSoft, lineHeight: 1.7, margin: "0 0 32px" }}>
          To be straight with you: Jobscan's per-job Match Rate report and its ATS-specific advice (Workday, Greenhouse, Taleo and friends) are the deepest in the category, and it adds LinkedIn profile optimization. If that one report is all you need and $49.95/mo fits your budget, it's a strong tool. But most job seekers need the whole search - resume, cover letter, tailoring, interview prep, and finding postings - and that is exactly what eCareer Design bundles for $9.99/mo.
        </p>

        <h2 style={{ fontFamily: serif, fontSize: 24, margin: "0 0 12px", color: TOKENS.ink }}>
          Try the free part first
        </h2>
        <p style={{ fontSize: 15.5, color: TOKENS.inkSoft, lineHeight: 1.7, margin: "0 0 24px" }}>
          You don't have to take our word for any of this. Score your resume free in about 30 seconds - no account, no card. If the score helps, the free builder, tailoring, cover letter, and job search tools are waiting.
        </p>

        <div style={{ background: TOKENS.ink, borderRadius: 20, padding: "2.5rem", margin: "8px 0 48px" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accentSoft, textTransform: "uppercase", margin: "0 0 10px" }}>
            Free ATS score
          </p>
          <h2 style={{ fontFamily: serif, fontSize: 26, color: "#fff", margin: "0 0 20px", lineHeight: 1.25 }}>
            See your resume's ATS score in 30 seconds
          </h2>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/ats-checker" style={{ display: "inline-block", background: "#fff", color: TOKENS.accent, fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 10, textDecoration: "none" }}>
              Check My Score Free
            </Link>
            <Link href="/pricing" style={{ display: "inline-block", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", fontWeight: 600, fontSize: 15, padding: "13px 26px", borderRadius: 10, textDecoration: "none" }}>
              See Pricing - $9.99/mo
            </Link>
          </div>
        </div>

        <h2 style={{ fontFamily: serif, fontSize: 24, margin: "0 0 16px", color: TOKENS.ink }}>
          Common questions
        </h2>
        {faqSchema.mainEntity.map((q) => (
          <div key={q.name} style={{ borderTop: `1px solid ${TOKENS.line}`, padding: "16px 0" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: TOKENS.ink, margin: "0 0 6px" }}>{q.name}</h3>
            <p style={{ fontSize: 14.5, color: TOKENS.inkSoft, lineHeight: 1.65, margin: 0 }}>{q.acceptedAnswer.text}</p>
          </div>
        ))}
      </main>

      <footer style={{ borderTop: `1px solid ${TOKENS.line}`, padding: "24px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
          <Link href="/" style={{ color: TOKENS.inkSoft }}>eCareer Design</Link>
          {" · "}
          <Link href="/pricing" style={{ color: TOKENS.inkSoft }}>Pricing</Link>
          {" · "}
          <Link href="/privacy" style={{ color: TOKENS.inkSoft }}>Privacy Notice</Link>
          {" · "}
          <Link href="/terms" style={{ color: TOKENS.inkSoft }}>Terms of Use</Link>
        </p>
      </footer>
    </div>
  );
                }

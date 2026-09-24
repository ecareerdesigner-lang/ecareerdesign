import Link from "next/link";

export const metadata = {
  title: "Teal Alternative: eCareer Design vs Teal - $9.99/mo",
  description:
    "Comparing Teal vs eCareer Design? Teal+ runs $13/week (about $56/mo) or $29/mo. eCareer Design Premium is $9.99/mo with an AI resume builder, job tailoring, cover letters, interview coaching, match scoring, and job search.",
  alternates: { canonical: "https://www.ecareerdesign.net/teal-alternative" },
  openGraph: {
    title: "Teal vs eCareer Design: Same Goal, a Third of the Price",
    description:
      "Teal+ costs $13/week or $29/mo. eCareer Design Premium is $9.99/mo - resume, tailoring, cover letters, interview prep, and job search included.",
    url: "https://www.ecareerdesign.net/teal-alternative",
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
      name: "How much does Teal cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Teal+ costs $13 per week, $29 per month, or $79 per quarter (about $26 per month). The weekly plan works out to roughly $56 per month if left running - the most expensive way to buy it. Teal's free tier includes unlimited job tracking and resume versions. Prices checked September 24, 2026.",
      },
    },
    {
      "@type": "Question",
      name: "What is a cheaper alternative to Teal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "eCareer Design Premium is $9.99 per month - about a third of Teal's monthly plan. It includes an AI resume builder, job tailoring, cover letter generation, resume match scoring, interview coaching with mock interviews, and built-in job search.",
      },
    },
    {
      "@type": "Question",
      name: "Teal vs eCareer Design: which is better for tracking applications?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Teal's free job tracker with its Chrome extension is genuinely excellent and unlimited - if tracking is all you need, Teal's free tier is hard to beat. eCareer Design's Career Dashboard tracks applications, sets weekly goals, and notifies you of new job matches daily, and it is bundled with the resume, cover letter, and interview tools at $9.99/mo.",
      },
    },
    {
      "@type": "Question",
      name: "Does eCareer Design have a free plan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The free plan includes the AI resume builder, job tailoring, cover letter generation, and job search. You can also check your resume's ATS score free in about 30 seconds with no account.",
      },
    },
  ],
};

function Row({ label, ecareer, teal }) {
  return (
    <tr>
      <td style={{ padding: "12px 14px", borderTop: `1px solid ${TOKENS.line}`, fontSize: 14.5, color: TOKENS.ink, fontWeight: 600 }}>{label}</td>
      <td style={{ padding: "12px 14px", borderTop: `1px solid ${TOKENS.line}`, fontSize: 14.5, color: TOKENS.inkSoft, background: TOKENS.accentSoft }}>{ecareer}</td>
      <td style={{ padding: "12px 14px", borderTop: `1px solid ${TOKENS.line}`, fontSize: 14.5, color: TOKENS.inkSoft }}>{teal}</td>
    </tr>
  );
}

export default function TealAlternativePage() {
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
          Teal alternative
        </p>
        <h1 style={{ fontFamily: serif, fontWeight: 600, fontSize: 40, lineHeight: 1.18, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          Teal vs eCareer Design: same goal, a third of the price
        </h1>
        <p style={{ fontSize: 18, color: TOKENS.inkSoft, maxWidth: 680, margin: "0 0 12px", lineHeight: 1.6 }}>
          Teal+ costs $13/week (about $56/mo if it keeps renewing) or $29/mo. eCareer Design Premium is $9.99/mo - resume building, job tailoring, cover letters, match scoring, interview coaching, and job search in one place.
        </p>
        <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 36px" }}>
          Competitor prices checked September 24, 2026 on Teal's pricing page and current reviews.
        </p>

        <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, boxShadow: TOKENS.shadow, padding: "8px 18px 18px", marginBottom: 40, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "14px", fontSize: 13, color: TOKENS.inkSoft, fontWeight: 600 }}></th>
                <th style={{ textAlign: "left", padding: "14px", fontSize: 14, color: TOKENS.ink, fontWeight: 700, background: TOKENS.accentSoft }}>eCareer Design</th>
                <th style={{ textAlign: "left", padding: "14px", fontSize: 14, color: TOKENS.ink, fontWeight: 700 }}>Teal</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Paid price" ecareer="$9.99/mo" teal="$13/week (~$56/mo), $29/mo, or $79/quarter" />
              <Row label="Free plan" ecareer="Resume builder, job tailoring, cover letter, job search - plus a free ATS score with no account" teal="Unlimited job tracker and resume versions; AI features limited" />
              <Row label="AI resume content" ecareer="Included free" teal="Teal+ (unlimited AI bullets and summaries)" />
              <Row label="Resume match scoring" ecareer="Premium - full breakdown of what is missing against any posting" teal="Top-5 keywords free; full analysis on Teal+" />
              <Row label="Interview coaching" ecareer="Premium - mock interviews with voice and AI scoring" teal="Not offered" />
              <Row label="Job tracking" ecareer="Career Dashboard with weekly goals and daily match alerts" teal="Excellent free tracker plus Chrome extension" />
            </tbody>
          </table>
        </div>

        <h2 style={{ fontFamily: serif, fontSize: 24, margin: "0 0 12px", color: TOKENS.ink }}>
          Where Teal still wins
        </h2>
        <p style={{ fontSize: 15.5, color: TOKENS.inkSoft, lineHeight: 1.7, margin: "0 0 32px" }}>
          To be straight with you: Teal's free job tracker and Chrome extension are genuinely excellent, and if organizing applications is all you need, its free tier is hard to beat. The catch is the upgrade price: Teal+ starts at $13/week, which compounds to roughly $56 a month if the renewal keeps running, and even its monthly plan is $29. eCareer Design Premium gives you the whole search - resume, tailoring, cover letters, match scoring, interview prep, and job search - for $9.99/mo.
        </p>

        <h2 style={{ fontFamily: serif, fontSize: 24, margin: "0 0 12px", color: TOKENS.ink }}>
          Try the free part first
        </h2>
        <p style={{ fontSize: 15.5, color: TOKENS.inkSoft, lineHeight: 1.7, margin: "0 0 24px" }}>
          Score your resume free in about 30 seconds - no account, no card. If the score helps, the free builder, tailoring, cover letter, and job search tools are waiting.
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

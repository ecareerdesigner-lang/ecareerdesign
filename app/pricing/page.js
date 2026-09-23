import Link from "next/link";

export const metadata = {
  title: "Pricing: Free & Premium Plans - eCareer Design",
  description:
    "Start free with eCareer Design's resume builder, job tailoring, cover letters, and job search. Upgrade to Premium for $9.99/mo to unlock the career dashboard, interview coach, resume match scoring, and performance review writer.",
  alternates: { canonical: "https://www.ecareerdesign.net/pricing" },
  openGraph: {
    title: "eCareer Design Pricing",
    description:
      "Start free. Upgrade to Premium for $9.99/mo when you're ready to move faster.",
    url: "https://www.ecareerdesign.net/pricing",
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

function Check({ color }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Feature({ dark, title, children }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <Check color={dark ? TOKENS.accent : TOKENS.green} />
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 2px", color: dark ? "#fff" : TOKENS.ink }}>{title}</p>
        <p style={{ fontSize: 13.5, color: dark ? "#C9D2DD" : TOKENS.inkSoft, margin: 0, lineHeight: 1.5 }}>{children}</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div style={{ fontFamily: sans, background: TOKENS.paper, minHeight: "100vh", color: TOKENS.ink }}>
      <header style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ fontFamily: serif, fontWeight: 600, fontSize: 20, color: TOKENS.ink, textDecoration: "none" }}>
          eCareer Design
        </Link>
        <Link href="/?view=auth" style={{ fontSize: 14.5, fontWeight: 600, color: TOKENS.accent, textDecoration: "none" }}>
          Sign in
        </Link>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: serif, fontWeight: 600, fontSize: 40, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
            Choose your plan
          </h1>
          <p style={{ fontSize: 17, color: TOKENS.inkSoft, margin: 0 }}>
            Start free. Upgrade whenever you're ready to move faster.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
          <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, boxShadow: TOKENS.shadow, padding: 32 }}>
            <h2 style={{ fontFamily: serif, fontSize: 28, margin: "0 0 6px", color: TOKENS.ink }}>Free</h2>
            <p style={{ fontSize: 15, color: TOKENS.inkSoft, margin: "0 0 20px", lineHeight: 1.5 }}>
              Everything you need to build a standout application.
            </p>
            <p style={{ fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: "0 0 24px" }}>$0</p>
            <div style={{ borderTop: `1px solid ${TOKENS.line}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <Feature title="Resume Builder">Build an ATS-friendly resume in minutes.</Feature>
              <Feature title="Job Tailoring">Tailored STAR responses for any posting.</Feature>
              <Feature title="Cover Letter">Generate a matching cover letter.</Feature>
              <Feature title="Job Search">Search real postings across USAJOBS, Adzuna &amp; Jooble.</Feature>
            </div>
            <Link
              href="/?view=auth"
              style={{ display: "block", textAlign: "center", padding: "14px 20px", borderRadius: 10, border: `1.5px solid ${TOKENS.ink}`, color: TOKENS.ink, fontWeight: 600, fontSize: 15, textDecoration: "none" }}
            >
              Get Started Free
            </Link>
          </div>

          <div style={{ background: TOKENS.ink, border: "none", borderRadius: 18, boxShadow: TOKENS.shadow, padding: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accentSoft, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Premium
            </p>
            <h2 style={{ fontFamily: serif, fontSize: 28, margin: "0 0 6px", color: "#fff" }}>Everything you need to land the offer</h2>
            <p style={{ fontSize: 15, color: "#C9D2DD", margin: "0 0 20px", lineHeight: 1.5 }}>
              Prep smarter, track everything, and know exactly where you stand.
            </p>
            <p style={{ fontSize: 34, fontWeight: 600, color: "#fff", margin: "0 0 24px" }}>
              $9.99<span style={{ fontSize: 16, fontWeight: 400, color: "#C9D2DD" }}> /mo</span>
            </p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accentSoft, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Everything in Free, plus:
              </p>
              <Feature dark title="Career Dashboard">
                Track applications, set weekly goals, and get notified of new job matches automatically, every day.
              </Feature>
              <Feature dark title="Interview Coach">
                Extract your best career stories, practice job-specific questions, and run full adaptive mock interviews with voice and AI scoring.
              </Feature>
              <Feature dark title="Resume Match Scoring">
                See exactly how well your resume matches any job posting, with a breakdown of what's missing.
              </Feature>
              <Feature dark title="Performance Review Writer">
                Write polished, first-person federal performance reviews for mid-year, end-of-year, or end-of-position evaluations, with AI enhancement built around the actual Exceeds Fully Successful rating standard.
              </Feature>
            </div>
            <Link
              href="/?view=pricing"
              style={{ display: "block", textAlign: "center", padding: "14px 20px", borderRadius: 10, background: TOKENS.accent, color: "#fff", fontWeight: 600, fontSize: 16, textDecoration: "none" }}
            >
              Subscribe - $9.99/mo
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 14, color: TOKENS.inkSoft, textAlign: "center" }}>
          Don't have an account yet?{" "}
          <Link href="/?view=auth" style={{ color: TOKENS.accent, fontWeight: 500 }}>
            Sign up first
          </Link>
        </p>
      </main>

      <footer style={{ borderTop: `1px solid ${TOKENS.line}`, padding: "24px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
          <Link href="/" style={{ color: TOKENS.inkSoft }}>eCareer Design</Link>
          {" · "}
          <Link href="/privacy" style={{ color: TOKENS.inkSoft }}>Privacy Notice</Link>
          {" · "}
          <Link href="/terms" style={{ color: TOKENS.inkSoft }}>Terms of Use</Link>
        </p>
      </footer>
    </div>
  );
}

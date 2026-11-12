import Link from "next/link";
import { pageMeta } from "../../lib/seo";
import JsonLd from "../../components/JsonLd";
import PremiumDemos from "../../components/landing/PremiumDemos";
import { SITE_PROOF } from "../../lib/siteProof";
import { productJsonLd } from "../../lib/structuredData";
import { NEW_PAGES, PublicShell, PageHero, CtaBand } from "../../components/public/Blocks";

export const metadata = pageMeta({
  title: "Pricing: Free & Premium Plans - eCareer Design",
  description:
    "Start free with eCareer Design's resume builder, job tailoring and cover letters. Premium is $9.99/mo and adds the dashboard, interview coach and match scoring.",
  path: "/pricing",
  ogTitle: "eCareer Design Pricing",
  ogDescription: "Start free. Upgrade to Premium for $9.99/mo when you're ready to move faster.",
});

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

const MATRIX = [
  ["Readiness Scan", "Included", "Included", "Included"],
  ["ATS Score Checker", "Included", "Included", "Included"],
  ["Job Search (USAJOBS, Adzuna & Jooble)", "Included", "Included", "Included"],
  ["Resume Builder", "2 generations", "Unlimited", "Unlimited"],
  ["Job Tailoring (STAR)", "2 runs", "Unlimited", "Unlimited"],
  ["Cover Letters", "2 generations", "Unlimited", "Unlimited"],
  ["Career Dashboard", "", "Included", "Included"],
  ["Daily job-match notifications", "", "Included", "Included"],
  ["Match scoring on every job", "", "Included", "Included"],
  ["Interview Coach & Interview Prep reports", "", "Included", "Included"],
  ["Voice mock interviews with AI scoring", "", "Included", "Included"],
  ["Performance Review Writer", "", "Included", "Included"],
];

function Mark({ value }) {
  if (!value) {
    return (
      <>
        <span aria-hidden="true" style={{ color: TOKENS.inkSoft }}>&ndash;</span>
        <span style={{ position: "absolute", left: -9999 }}>Not included</span>
      </>
    );
  }
  if (value === "Included") {
    return (
      <>
        <span aria-hidden="true" style={{ color: TOKENS.green, fontWeight: 700 }}>&#10003;</span>
        <span style={{ position: "absolute", left: -9999 }}>Included</span>
      </>
    );
  }
  return <span style={{ fontWeight: 600, color: TOKENS.ink }}>{value}</span>;
}

function PlansAtAGlance() {
  const th = { padding: "12px", fontSize: 14, fontWeight: 600, textAlign: "left", borderBottom: `2px solid ${TOKENS.line}` };
  const td = { padding: "12px", fontSize: 15, verticalAlign: "top", borderBottom: `1px solid ${TOKENS.line}` };
  const h3 = { fontFamily: serif, fontSize: 21, margin: "24px 0 8px" };
  const ul = { margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.7, color: TOKENS.inkSoft, fontSize: 15 };
  return (
    <section style={{ margin: "48px 0 8px" }} aria-labelledby="glance-heading">
      <h2 id="glance-heading" style={{ fontFamily: serif, fontSize: 28, margin: "0 0 12px", textAlign: "center" }}>
        Plans at a glance
      </h2>
      <p style={{ fontSize: 15.5, color: TOKENS.inkSoft, lineHeight: 1.65, margin: "0 0 16px" }}>
        Free costs $0 and includes 2 generations each of the resume builder, job tailoring and cover letter. Premium is $9.99/mo, and the 30-day pass is $15.99 one time. Both paid options include the same features.
      </p>
      <div style={{ overflowX: "auto", background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, boxShadow: TOKENS.shadow }}>
        <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th scope="col" style={th}>Plan</th>
              <th scope="col" style={th}>Price</th>
              <th scope="col" style={th}>Resume, cover letter, job tailoring</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row" style={{ ...td, textAlign: "left" }}>Free</th><td style={td}>$0</td><td style={td}>2 generations each</td></tr>
            <tr><th scope="row" style={{ ...td, textAlign: "left" }}>Premium</th><td style={td}>$9.99/mo, renews monthly until cancelled</td><td style={td}>Unlimited</td></tr>
            <tr><th scope="row" style={{ ...td, textAlign: "left" }}>30-day pass</th><td style={td}>$15.99 one time, no auto-renew</td><td style={td}>Unlimited</td></tr>
          </tbody>
        </table>
      </div>

      <h3 style={h3}>Free plan</h3>
      <p style={{ fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.65, margin: "0 0 8px" }}>
        The scores and job search are not limited. The three AI builders each give 2 generations, and a regeneration counts as another one.
      </p>
      <p style={{ fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Not limited, no account needed for the scores:</p>
      <ul style={ul}>
        <li>Resume Readiness Scan: overall, ATS, keyword and formatting scores, with the full report by email</li>
        <li>ATS Score Checker</li>
        <li>Resume vs. job posting match checker</li>
        <li>Job Search across USAJOBS, Adzuna and Jooble</li>
      </ul>
      <p style={{ fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>Free account required, 2 each:</p>
      <ul style={ul}>
        <li>Resume Builder: 2 generations</li>
        <li>Job Tailoring (requirements extraction and STAR responses): 2 runs</li>
        <li>Cover Letter: 2 generations</li>
      </ul>

      <h3 style={h3}>Premium plan</h3>
      <p style={{ fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.65, margin: "0 0 8px" }}>
        Premium includes everything in Free, with no limit on the three builders, plus:
      </p>
      <ul style={ul}>
        <li>Career Dashboard: application tracking, weekly goals and saved work</li>
        <li>Daily job-match notifications</li>
        <li>Match scoring on every job in your search and dashboard</li>
        <li>Interview Coach: career stories and job-specific practice questions</li>
        <li>Mock interviews: adaptive, by voice, with AI scoring</li>
        <li>Interview Prep reports</li>
        <li>Performance Review Writer for federal reviews, with AI enhancement</li>
        <li>Apply Assistant Chrome extension (in development)</li>
      </ul>
    </section>
  );
}

function ComparisonMatrix() {
  const th = { padding: "14px 12px", fontSize: 14, fontWeight: 600, textAlign: "center", color: TOKENS.ink, borderBottom: `2px solid ${TOKENS.line}` };
  const td = { padding: "12px", textAlign: "center", fontSize: 15, borderBottom: `1px solid ${TOKENS.line}`, position: "relative" };
  return (
    <section style={{ margin: "40px 0 8px" }} aria-labelledby="compare-heading">
      <h2 id="compare-heading" style={{ fontFamily: serif, fontSize: 28, margin: "0 0 16px", textAlign: "center" }}>
        Compare plans
      </h2>
      <div style={{ overflowX: "auto", background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, boxShadow: TOKENS.shadow }}>
        <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th scope="col" style={{ ...th, textAlign: "left" }}>Feature</th>
              <th scope="col" style={th}>Free<br /><span style={{ fontWeight: 400, color: TOKENS.inkSoft }}>$0</span></th>
              <th scope="col" style={th}>Premium<br /><span style={{ fontWeight: 400, color: TOKENS.inkSoft }}>$9.99/mo</span></th>
              <th scope="col" style={th}>30-Day Pass<br /><span style={{ fontWeight: 400, color: TOKENS.inkSoft }}>$15.99 one time</span></th>
            </tr>
          </thead>
          <tbody>
            {MATRIX.map(([label, ...cols]) => (
              <tr key={label}>
                <th scope="row" style={{ ...td, textAlign: "left", fontWeight: 500 }}>{label}</th>
                {cols.map((c, i) => (
                  <td key={i} style={td}><Mark value={c} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, textAlign: "center", margin: "12px 0 0", lineHeight: 1.5 }}>
        * Free includes 2 generations each of the resume builder, job tailoring, and cover letter. Premium and the 30-day pass remove that limit.
      </p>
    </section>
  );
}

function OldPricingPage() {
  return (
    <div style={{ fontFamily: sans, background: TOKENS.paper, minHeight: "100vh", color: TOKENS.ink }}>
      <JsonLd data={productJsonLd} />
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
          <p style={{ fontSize: 15.5, color: TOKENS.inkSoft, margin: "10px 0 0" }}>
            Full toolkit at $9.99/mo. Jobscan Premium is $49.95/mo.{" "}
            <Link href="/jobscan-alternative" style={{ color: TOKENS.accent, fontWeight: 500 }}>See the comparison</Link>
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
          <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, boxShadow: TOKENS.shadow, padding: 32 }}>
            <h2 style={{ fontFamily: serif, fontSize: 28, margin: "0 0 6px", color: TOKENS.ink }}>Free</h2>
            <p style={{ fontSize: 15, color: TOKENS.inkSoft, margin: "0 0 20px", lineHeight: 1.5 }}>
              Try the core tools free. Includes 2 free generations each of resume, cover letter, and job tailoring.
            </p>
            <p style={{ fontSize: 34, fontWeight: 600, color: TOKENS.ink, margin: "0 0 24px" }}>$0</p>
            <div style={{ borderTop: `1px solid ${TOKENS.line}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <Feature title="Resume Builder">Build an ATS-friendly resume in minutes. 2 free generations.</Feature>
              <Feature title="Job Tailoring">Tailored STAR responses for any posting. 2 free runs.</Feature>
              <Feature title="Cover Letter">Generate a matching cover letter. 2 free generations.</Feature>
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
              <span style={{ marginLeft: 10, background: TOKENS.accent, color: "#fff", padding: "3px 10px", borderRadius: 999, fontSize: 11.5, letterSpacing: "0.03em" }}>
                Most popular
              </span>
            </p>
            <h2 style={{ fontFamily: serif, fontSize: 28, margin: "0 0 6px", color: "#fff" }}>Everything you need to land the offer</h2>
            <p style={{ fontSize: 15, color: "#C9D2DD", margin: "0 0 20px", lineHeight: 1.5 }}>
              Prep smarter, track everything, and know exactly where you stand.
            </p>
            <p style={{ fontSize: 34, fontWeight: 600, color: "#fff", margin: "0 0 24px" }}>
              $9.99<span style={{ fontSize: 16, fontWeight: 400, color: "#C9D2DD" }}> /mo</span>
            </p>
            <p style={{ fontSize: 14, color: "#C9D2DD", margin: "-14px 0 24px", lineHeight: 1.5 }}>
              About 5x less than Jobscan Premium ($49.95/mo, checked Sept 24, 2026).{" "}
              <Link href="/jobscan-alternative" style={{ color: TOKENS.accentSoft }}>See the comparison</Link>
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
              {process.env.NEXT_PUBLIC_EXTENSION_URL && (
                <Feature dark title="Apply Assistant (Chrome extension)">
                  Find roles that fit your resume, get a tailored resume and cover letter for each, and have application forms filled in. You review and approve every send.
                </Feature>
              )}
            </div>
            <Link
              href="/?view=pricing"
              style={{ display: "block", textAlign: "center", padding: "14px 20px", borderRadius: 10, background: TOKENS.accent, color: "#fff", fontWeight: 600, fontSize: 16, textDecoration: "none" }}
            >
              Subscribe - $9.99/mo
            </Link>
                                   <p style={{ fontSize: 13, color: "#C9D2DD", textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
              Renews every month until you cancel.
            </p>
            {SITE_PROOF.guaranteeDays && (
              <p style={{ fontSize: 13, color: "#C9D2DD", textAlign: "center", margin: "6px 0 0", lineHeight: 1.5 }}>
                {SITE_PROOF.guaranteeDays}-day money-back, no questions asked.
              </p>
            )}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: 24, paddingTop: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accentSoft, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Or pay once
              </p>
              <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>
                30-day pass: $15.99 <span style={{ fontSize: 14, fontWeight: 400, color: "#C9D2DD" }}>one time</span>
              </p>
              <p style={{ fontSize: 14, color: "#C9D2DD", margin: "0 0 16px", lineHeight: 1.55 }}>
                Everything in Premium for 30 days. It doesn't renew, so there's nothing to cancel and you aren't charged again. Good if you're focused on one job search and don't want a subscription. Buy another any time to add 30 more days.
              </p>
              <Link
                href="/?view=pricing"
                style={{ display: "block", textAlign: "center", padding: "12px 20px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.35)", color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none" }}
              >
                Get the 30-day pass: $15.99
              </Link>
            </div>
            <p style={{ fontSize: 13, color: "#C9D2DD", textAlign: "center", margin: "20px 0 0", lineHeight: 1.5 }}>
              Payments are handled by Stripe. We never see your card details.
            </p>
          </div>
        </div>

        <PlansAtAGlance />

        <ComparisonMatrix />

        <section style={{ margin: "40px 0" }} aria-labelledby="demo-heading">
          <h2 id="demo-heading" style={{ fontFamily: serif, fontSize: 28, margin: "0 0 16px", textAlign: "center" }}>
            See the Premium tools in action
          </h2>
          <PremiumDemos />
        </section>

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

// ---- New look (only when NEXT_PUBLIC_NEW_PUBLIC_PAGES=1). Same copy, prices and links as below. ----
function NewPricing() {
  return (
    <PublicShell>
      <JsonLd data={productJsonLd} />
      <PageHero
        eyebrow="Pricing"
        title="Choose your plan"
        lead="Start free. Upgrade whenever you're ready to move faster."
        img="/landing/compass.jpg"
      >
        <p className="np-small" style={{ fontSize: 15.5 }}>
          Full toolkit at $9.99/mo. Jobscan Premium is $49.95/mo.{" "}
          <a href="/jobscan-alternative" style={{ color: "#FFB07A", fontWeight: 600 }}>See the comparison</a>
        </p>
        <div style={{ height: 70 }} />
      </PageHero>

      <div className="np-wrap">
        <div className="np-price">
          <div className="np-card">
            <h2 style={{ fontSize: 28, margin: "0 0 6px" }}>Free</h2>
            <p style={{ fontSize: 15, color: TOKENS.inkSoft, margin: "0 0 20px", lineHeight: 1.5 }}>
              Try the core tools free. Includes 2 free generations each of resume, cover letter, and job tailoring.
            </p>
            <p className="np-big" style={{ margin: "0 0 24px" }}>$0</p>
            <div style={{ borderTop: `1px solid ${TOKENS.line}`, paddingTop: 20, display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <Feature title="Resume Builder">Build an ATS-friendly resume in minutes. 2 free generations.</Feature>
              <Feature title="Job Tailoring">Tailored STAR responses for any posting. 2 free runs.</Feature>
              <Feature title="Cover Letter">Generate a matching cover letter. 2 free generations.</Feature>
              <Feature title="Job Search">Search real postings across USAJOBS, Adzuna &amp; Jooble.</Feature>
            </div>
            <Link href="/?view=auth" className="np-btn np-btn-gh np-btn-block">Get Started Free</Link>
          </div>

          <div className="np-card np-card-dark">
            <p className="np-eyebrow" style={{ color: TOKENS.accentSoft, margin: "0 0 8px" }}>
              Premium
              <span className="np-chip-pop">Most popular</span>
            </p>
            <h2 style={{ fontSize: 28, margin: "0 0 6px", color: "#fff" }}>Everything you need to land the offer</h2>
            <p style={{ fontSize: 15, color: "#C9D2DD", margin: "0 0 20px", lineHeight: 1.5 }}>
              Prep smarter, track everything, and know exactly where you stand.
            </p>
            <p className="np-big" style={{ margin: "0 0 24px" }}>
              $9.99<span style={{ fontSize: 16, fontWeight: 400, color: "#C9D2DD", fontFamily: "var(--np-body), system-ui, sans-serif" }}> /mo</span>
            </p>
            <p style={{ fontSize: 14, color: "#C9D2DD", margin: "-14px 0 24px", lineHeight: 1.5 }}>
              About 5x less than Jobscan Premium ($49.95/mo, checked Sept 24, 2026).{" "}
              <Link href="/jobscan-alternative" style={{ color: TOKENS.accentSoft }}>See the comparison</Link>
            </p>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
              <p className="np-eyebrow" style={{ color: TOKENS.accentSoft, margin: 0 }}>Everything in Free, plus:</p>
              <Feature dark title="Career Dashboard">
                Track applications, set weekly goals, and get notified of new job matches automatically, every day.
              </Feature>
              <Feature dark title="Interview Coach">
                Extract your best career stories, practice job-specific questions, and run full adaptive mock interviews with voice and AI scoring.
              </Feature>
              <Feature dark title="Resume Match Scoring">
                See exactly how well your resume matches any job posting, with a breakdown of what&apos;s missing.
              </Feature>
              <Feature dark title="Performance Review Writer">
                Write polished, first-person federal performance reviews for mid-year, end-of-year, or end-of-position evaluations, with AI enhancement built around the actual Exceeds Fully Successful rating standard.
              </Feature>
              {process.env.NEXT_PUBLIC_EXTENSION_URL && (
                <Feature dark title="Apply Assistant (Chrome extension)">
                  Find roles that fit your resume, get a tailored resume and cover letter for each, and have application forms filled in. You review and approve every send.
                </Feature>
              )}
            </div>
            <Link href="/?view=pricing" className="np-btn np-btn-or np-btn-block">Subscribe - $9.99/mo</Link>
            <p style={{ fontSize: 13, color: "#C9D2DD", textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
              Renews every month until you cancel.
            </p>
            {SITE_PROOF.guaranteeDays && (
              <p style={{ fontSize: 13, color: "#C9D2DD", textAlign: "center", margin: "6px 0 0", lineHeight: 1.5 }}>
                {SITE_PROOF.guaranteeDays}-day money-back, no questions asked.
              </p>
            )}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", marginTop: 24, paddingTop: 24 }}>
              <p className="np-eyebrow" style={{ color: TOKENS.accentSoft, margin: "0 0 8px" }}>Or pay once</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>
                30-day pass: $15.99 <span style={{ fontSize: 14, fontWeight: 400, color: "#C9D2DD" }}>one time</span>
              </p>
              <p style={{ fontSize: 14, color: "#C9D2DD", margin: "0 0 16px", lineHeight: 1.55 }}>
                Everything in Premium for 30 days. It doesn&apos;t renew, so there&apos;s nothing to cancel and you aren&apos;t charged again. Good if you&apos;re focused on one job search and don&apos;t want a subscription. Buy another any time to add 30 more days.
              </p>
              <Link href="/?view=pricing" className="np-btn np-btn-line np-btn-block">Get the 30-day pass: $15.99</Link>
            </div>
            <p style={{ fontSize: 13, color: "#C9D2DD", textAlign: "center", margin: "20px 0 0", lineHeight: 1.5 }}>
              Payments are handled by Stripe. We never see your card details.
            </p>
          </div>
        </div>

        <div className="np-narrow" style={{ padding: 0, maxWidth: 960 }}>
          <PlansAtAGlance />
          <ComparisonMatrix />
        </div>

        <section style={{ margin: "56px 0 8px" }} aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="np-h2" style={{ textAlign: "center", marginBottom: 20 }}>
            See the Premium tools in action
          </h2>
          <PremiumDemos />
        </section>
      </div>

      <CtaBand eyebrow="Not ready yet?" title="Score your resume free first. No account needed.">
        <Link href="/ats-checker" className="np-btn np-btn-or">Check My Score Free</Link>
        <Link href="/?view=auth" className="np-btn np-btn-line">Sign up free</Link>
      </CtaBand>
    </PublicShell>
  );
}

export default function PricingPage() {
  if (NEW_PAGES) return <NewPricing />;
  return <OldPricingPage />;
}


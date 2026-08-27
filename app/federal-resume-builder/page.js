export const metadata = {
  title: "Federal Resume Builder | eCareer Design",
  description: "Stop getting marked \"eligible but not referred.\" Build a federal resume that explicitly matches the qualifications USAJOBS reviewers score against.",
};

const TOKENS = {
  ink: "#16283D",
  inkSoft: "#3C5069",
  paper: "#EEF0EC",
  surface: "#FFFFFF",
  line: "#D7DBD6",
  accent: "#F2660A",
  accentSoft: "#FDE3CC",
  shadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px rgba(16,24,40,0.07)",
};

const styles = {
  page: { maxWidth: 880, margin: "0 auto", padding: "3rem 1.5rem 5rem", fontFamily: "'Inter', Arial, sans-serif", color: TOKENS.ink, lineHeight: 1.6 },
  back: { fontSize: 14, fontFamily: "'Inter', Arial, sans-serif", color: TOKENS.accent, textDecoration: "none" },
  eyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accent, textTransform: "uppercase", margin: "28px 0 10px" },
  h1: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 38, fontWeight: 600, lineHeight: 1.18, margin: "0 0 16px", color: TOKENS.ink },
  sub: { fontSize: 18, color: TOKENS.inkSoft, maxWidth: 660, margin: "0 0 28px" },
  ctaRow: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 6 },
  button: {
    display: "inline-block", background: TOKENS.accent, color: "#fff", fontFamily: "'Inter', Arial, sans-serif",
    fontSize: 15, fontWeight: 600, padding: "13px 26px", borderRadius: 10, textDecoration: "none", border: "none",
  },
  trustLine: { fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 48px" },
  alertCard: { background: TOKENS.accentSoft, border: `1px solid ${TOKENS.accent}`, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: 44 },
  alertLabel: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: TOKENS.accent, margin: "0 0 8px" },
  alertText: { fontSize: 15, color: TOKENS.ink, margin: 0, lineHeight: 1.6 },
  h2: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 600, margin: "56px 0 20px", color: TOKENS.ink },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 8 },
  card: { background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, padding: "1.5rem", boxShadow: TOKENS.shadow },
  stepNum: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: TOKENS.accent, fontWeight: 700, marginBottom: 6 },
  cardTitle: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, margin: "0 0 6px", color: TOKENS.ink },
  cardBody: { fontSize: 14.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.55 },
  list: { fontSize: 15.5, color: TOKENS.inkSoft, lineHeight: 1.8, paddingLeft: 22, margin: 0 },
  faqItem: { marginBottom: 22 },
  faqQ: { fontFamily: "'Inter', Arial, sans-serif", fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: TOKENS.ink },
  faqA: { fontSize: 15, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.6 },
  ctaCard: { background: TOKENS.ink, borderRadius: 20, padding: "2.5rem", margin: "60px 0 40px", textAlign: "left" },
  ctaEyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accentSoft, textTransform: "uppercase", margin: "0 0 10px" },
  ctaHeading: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, color: "#fff", margin: "0 0 20px", lineHeight: 1.25 },
  relatedLine: { fontSize: 14.5, color: TOKENS.inkSoft, marginTop: 8 },
  relatedLink: { color: TOKENS.accent, textDecoration: "underline" },
};

export default function FederalResumeBuilderPage() {
  return (
    <div style={styles.page}>
      <a href="/" style={styles.back}>&larr; Back to eCareer Design</a>

      <p style={styles.eyebrow}>Federal &amp; USAJOBS Resumes</p>
      <h1 style={styles.h1}>Stop Getting Marked &ldquo;Eligible But Not Referred&rdquo;</h1>
      <p style={styles.sub}>
        Federal resumes aren&rsquo;t scored like private-sector resumes. eCareer Design checks your resume against the
        exact qualification language in the job announcement &mdash; the same thing USAJOBS reviewers score against
        &mdash; before you submit, not after you get the notice.
      </p>
      <div style={styles.ctaRow}>
        <a href="/" style={styles.button}>Check My Resume Free</a>
      </div>
      <p style={styles.trustLine}>No account required to start.</p>

      <div style={styles.alertCard}>
        <p style={styles.alertLabel}>The most common outcome</p>
        <p style={styles.alertText}>
          &ldquo;Eligible, Not Referred&rdquo; means HR confirmed you meet the minimum qualifications &mdash; but when your
          application was scored and ranked, it didn&rsquo;t make the group forwarded to the hiring manager. It&rsquo;s one
          of the most common, most frustrating outcomes in federal hiring, and it happens to genuinely qualified people
          constantly.
        </p>
      </div>

      <h2 style={styles.h2}>Why Federal Resumes Get Screened Out</h2>
      <ul style={styles.list}>
        <li>The resume doesn&rsquo;t mirror the announcement&rsquo;s exact &ldquo;specialized experience&rdquo; language</li>
        <li>Missing hours-per-week or duration details needed to prove qualifying experience</li>
        <li>Self-assessment questionnaire answers don&rsquo;t match what the resume actually demonstrates</li>
        <li>Required licenses or certifications aren&rsquo;t clearly and explicitly stated</li>
        <li>The resume is too short &mdash; federal resumes need far more detail than private-sector resumes (2&ndash;4+ pages is normal)</li>
      </ul>

      <h2 style={styles.h2}>How It Works</h2>
      <div style={styles.stepsGrid}>
        <div style={styles.card}>
          <p style={styles.stepNum}>Step 1</p>
          <h3 style={styles.cardTitle}>Paste the announcement</h3>
          <p style={styles.cardBody}>Add the job announcement, including the &ldquo;specialized experience&rdquo; and qualifications section.</p>
        </div>
        <div style={styles.card}>
          <p style={styles.stepNum}>Step 2</p>
          <h3 style={styles.cardTitle}>Add your resume</h3>
          <p style={styles.cardBody}>Use your existing background &mdash; the same info that powers your resume, cover letter, and interview prep.</p>
        </div>
        <div style={styles.card}>
          <p style={styles.stepNum}>Step 3</p>
          <h3 style={styles.cardTitle}>See what&rsquo;s missing</h3>
          <p style={styles.cardBody}>Get a match score showing where your real experience isn&rsquo;t stated in the terms a reviewer is scoring against.</p>
        </div>
      </div>

      <h2 style={styles.h2}>Frequently Asked Questions</h2>
      <div style={styles.faqItem}>
        <p style={styles.faqQ}>Does &ldquo;Not Referred&rdquo; mean I was rejected?</p>
        <p style={styles.faqA}>Not exactly &mdash; it means your application didn&rsquo;t make it past the initial ranking to reach the hiring manager. It&rsquo;s specific and often fixable for your next application.</p>
      </div>
      <div style={styles.faqItem}>
        <p style={styles.faqQ}>Can eCareer Design write a federal-format resume for me?</p>
        <p style={styles.faqA}>eCareer Design helps you build and tailor your resume content and checks it against a specific job posting&rsquo;s language &mdash; including federal announcements. You should still follow your target agency&rsquo;s formatting guidance for length and structure.</p>
      </div>
      <div style={styles.faqItem}>
        <p style={styles.faqQ}>Is this only for federal jobs?</p>
        <p style={styles.faqA}>No &mdash; the same resume match/tailoring tool works for any job posting. Federal announcements just tend to reward explicit, detailed matching more heavily than private-sector resumes do.</p>
      </div>

      <div style={styles.ctaCard}>
        <p style={styles.ctaEyebrow}>Before you submit</p>
        <h2 style={styles.ctaHeading}>Check Whether Your Resume Actually Matches the Announcement</h2>
        <a href="/" style={styles.button}>Check My Resume Free</a>
      </div>

      <p style={styles.relatedLine}>
        Want the full breakdown first? Read{" "}
        <a href="/blog/eligible-but-not-referred-federal-jobs" style={styles.relatedLink}>
          Why You Keep Getting &ldquo;Eligible But Not Referred&rdquo; for Federal Jobs
        </a>.
      </p>
    </div>
  );
}

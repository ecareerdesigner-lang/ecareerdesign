export const metadata = {
  title: "AI Cover Letter Generator | eCareer Design",
  description: "Generate a cover letter matched to any job posting in about a minute. Free, no templates, no rewriting from scratch — built from your resume with AI.",
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
  h1: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 40, fontWeight: 600, lineHeight: 1.15, margin: "0 0 16px", color: TOKENS.ink },
  sub: { fontSize: 18, color: TOKENS.inkSoft, maxWidth: 640, margin: "0 0 28px" },
  ctaRow: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 6 },
  button: {
    display: "inline-block", background: TOKENS.accent, color: "#fff", fontFamily: "'Inter', Arial, sans-serif",
    fontSize: 15, fontWeight: 600, padding: "13px 26px", borderRadius: 10, textDecoration: "none", border: "none",
  },
  buttonDark: {
    display: "inline-block", background: TOKENS.ink, color: "#fff", fontFamily: "'Inter', Arial, sans-serif",
    fontSize: 15, fontWeight: 600, padding: "13px 26px", borderRadius: 10, textDecoration: "none", border: "none",
  },
  trustLine: { fontSize: 13.5, color: TOKENS.inkSoft, margin: "10px 0 32px" },
  heroSample: { background: TOKENS.paper, border: `1.5px solid ${TOKENS.accent}`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: 44 },
  heroSampleLabel: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: TOKENS.accent, margin: "0 0 8px" },
  heroSampleText: { fontSize: 15, color: TOKENS.ink, fontStyle: "italic", margin: "0 0 8px", lineHeight: 1.6 },
  heroSampleCaption: { fontSize: 13, color: TOKENS.inkSoft, margin: 0 },
  h2: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 600, margin: "56px 0 20px", color: TOKENS.ink },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 8 },
  card: { background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, padding: "1.5rem", boxShadow: TOKENS.shadow },
  stepNum: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, color: TOKENS.accent, fontWeight: 700, marginBottom: 6 },
  cardTitle: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, margin: "0 0 6px", color: TOKENS.ink },
  cardBody: { fontSize: 14.5, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.55 },
  compareGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 8 },
  compareCardWeak: { background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, padding: "1.5rem", boxShadow: TOKENS.shadow },
  compareCardStrong: { background: TOKENS.surface, border: `1.5px solid ${TOKENS.accent}`, borderRadius: 18, padding: "1.5rem", boxShadow: TOKENS.shadow },
  compareLabel: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },
  compareLabelWeak: { color: TOKENS.inkSoft },
  compareLabelStrong: { color: TOKENS.accent },
  compareText: { fontSize: 14.5, color: TOKENS.ink, fontStyle: "italic", margin: 0, lineHeight: 1.6 },
  faqItem: { marginBottom: 22 },
  faqQ: { fontFamily: "'Inter', Arial, sans-serif", fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: TOKENS.ink },
  faqA: { fontSize: 15, color: TOKENS.inkSoft, margin: 0, lineHeight: 1.6 },
  ctaCard: { background: TOKENS.ink, borderRadius: 20, padding: "2.5rem", margin: "60px 0 40px", textAlign: "left" },
  ctaEyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accentSoft, textTransform: "uppercase", margin: "0 0 10px" },
  ctaHeading: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, color: "#fff", margin: "0 0 20px", lineHeight: 1.25 },
  relatedLine: { fontSize: 14.5, color: TOKENS.inkSoft, marginTop: 8 },
  relatedLink: { color: TOKENS.accent, textDecoration: "underline" },
};

export default function CoverLetterGeneratorPage() {
  return (
    <div style={styles.page}>
      <a href="/" style={styles.back}>&larr; Back to eCareer Design</a>

      <p style={styles.eyebrow}>Free &middot; Ready in about a minute</p>
      <h1 style={styles.h1}>Stop Sending the Same Cover Letter to Every Job</h1>
      <p style={styles.sub}>
        Every recruiter can tell when a cover letter wasn&rsquo;t written for the role. eCareer Design writes one that
        actually is &mdash; matched to the exact job posting, built from your resume, ready in about a minute.
      </p>
      <div style={styles.ctaRow}>
        <a href="/" style={styles.button}>See My Cover Letter in 60 Seconds</a>
      </div>
      <p style={styles.trustLine}>No account required &mdash; ready in about 60 seconds.</p>

      <div style={styles.heroSample}>
        <p style={styles.heroSampleLabel}>What you&rsquo;ll get &mdash; matched to the job</p>
        <p style={styles.heroSampleText}>
          &ldquo;Your team is scaling lifecycle campaigns ahead of a Q4 launch &mdash; I spent the last two years doing
          exactly that, growing email-driven revenue 34% while cutting send volume. Here&rsquo;s how I&rsquo;d apply that here.&rdquo;
        </p>
        <p style={styles.heroSampleCaption}>Generated from your resume + the job posting &mdash; not a template with blanks.</p>
      </div>

      <h2 style={styles.h2}>How It Works</h2>
      <div style={styles.stepsGrid}>
        <div style={styles.card}>
          <p style={styles.stepNum}>Step 1</p>
          <h3 style={styles.cardTitle}>Start with your resume</h3>
          <p style={styles.cardBody}>Enter your background once &mdash; the same info powers your resume, cover letter, and interview prep.</p>
        </div>
        <div style={styles.card}>
          <p style={styles.stepNum}>Step 2</p>
          <h3 style={styles.cardTitle}>Add the job posting</h3>
          <p style={styles.cardBody}>Paste in the job description you&rsquo;re applying to. eCareer Design reads what the employer is actually asking for.</p>
        </div>
        <div style={styles.card}>
          <p style={styles.stepNum}>Step 3</p>
          <h3 style={styles.cardTitle}>Get a matched cover letter</h3>
          <p style={styles.cardBody}>In under a minute, get a letter written around this specific role &mdash; not a template with your name swapped in.</p>
        </div>
      </div>

      <h2 style={styles.h2}>The Cover Letter Difference</h2>
      <div style={styles.compareGrid}>
        <div style={styles.compareCardWeak}>
          <p style={{ ...styles.compareLabel, ...styles.compareLabelWeak }}>Generic (what most people send)</p>
          <p style={styles.compareText}>
            &ldquo;I am writing to express my interest in the Marketing Coordinator position. I believe my skills and experience make me a strong candidate for this role.&rdquo;
          </p>
        </div>
        <div style={styles.compareCardStrong}>
          <p style={{ ...styles.compareLabel, ...styles.compareLabelStrong }}>Matched to the job</p>
          <p style={styles.compareText}>
            &ldquo;Your team is scaling lifecycle campaigns ahead of a Q4 launch &mdash; I spent the last two years doing exactly that, growing email-driven revenue 34% while cutting send volume. Here&rsquo;s how I&rsquo;d apply that here.&rdquo;
          </p>
        </div>
      </div>

      <h2 style={styles.h2}>Frequently Asked Questions</h2>
      <div style={styles.faqItem}>
        <p style={styles.faqQ}>Do I have to write it myself?</p>
        <p style={styles.faqA}>No. You provide your background and the job posting; eCareer Design writes the draft. You can edit anything before you send it.</p>
      </div>
      <div style={styles.faqItem}>
        <p style={styles.faqQ}>Will it sound like a generic template?</p>
        <p style={styles.faqA}>No &mdash; it&rsquo;s generated fresh from the actual job posting every time, not filled into a fixed template with blanks.</p>
      </div>
      <div style={styles.faqItem}>
        <p style={styles.faqQ}>Is it really free?</p>
        <p style={styles.faqA}>Yes. Generating a cover letter is free, and you don&rsquo;t need an account to start.</p>
      </div>
      <div style={styles.faqItem}>
        <p style={styles.faqQ}>Can I use it for every application?</p>
        <p style={styles.faqA}>Yes &mdash; that&rsquo;s the point. A new job posting means a new, matched cover letter in about a minute, not another hour rewriting from scratch.</p>
      </div>

      <div style={styles.ctaCard}>
        <p style={styles.ctaEyebrow}>Ready when you are</p>
        <h2 style={styles.ctaHeading}>Write Your Next Cover Letter in a Minute, Not an Hour</h2>
        <a href="/" style={styles.button}>See My Cover Letter in 60 Seconds</a>
      </div>

      <p style={styles.relatedLine}>
        Want writing tips first? Read{" "}
        <a href="/blog/how-to-write-a-cover-letter-that-gets-read" style={styles.relatedLink}>
          How to Write a Cover Letter That Actually Gets Read
        </a>.
      </p>
    </div>
  );
}

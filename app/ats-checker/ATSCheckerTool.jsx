"use client";

import { useState } from "react";

const TOKENS = {
  ink: "#16283D",
  inkSoft: "#3C5069",
  paper: "#EEF0EC",
  surface: "#FFFFFF",
  line: "#D7DBD6",
  accent: "#F2660A",
  accentSoft: "#FDE3CC",
  red: "#C1440E",
  shadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 14px rgba(16,24,40,0.07)",
};

const styles = {
  page: { maxWidth: 880, margin: "0 auto", padding: "3rem 1.5rem 5rem", fontFamily: "'Inter', Arial, sans-serif", color: TOKENS.ink, lineHeight: 1.6 },
  back: { fontSize: 14, fontFamily: "'Inter', Arial, sans-serif", color: TOKENS.accent, textDecoration: "none" },
  eyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accent, textTransform: "uppercase", margin: "28px 0 10px" },
  h1: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 38, fontWeight: 600, lineHeight: 1.18, margin: "0 0 16px", color: TOKENS.ink },
  sub: { fontSize: 18, color: TOKENS.inkSoft, maxWidth: 660, margin: "0 0 28px" },
  trustLine: { fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 40px" },
  card: { background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 18, padding: "2rem", boxShadow: TOKENS.shadow, marginBottom: 32 },
  uploadBox: { border: `2px dashed ${TOKENS.line}`, borderRadius: 14, padding: "2.5rem 1.5rem", textAlign: "center", background: TOKENS.paper },
  uploadLabel: { cursor: "pointer", display: "block" },
  uploadText: { fontSize: 15.5, fontWeight: 600, color: TOKENS.ink, margin: "10px 0 4px" },
  uploadSubtext: { fontSize: 13, color: TOKENS.inkSoft, margin: 0 },
  button: {
    display: "inline-block", background: TOKENS.accent, color: "#fff", fontFamily: "'Inter', Arial, sans-serif",
    fontSize: 15, fontWeight: 600, padding: "13px 26px", borderRadius: 10, textDecoration: "none", border: "none", cursor: "pointer", marginTop: 18,
  },
  buttonDisabled: { opacity: 0.5, cursor: "not-allowed" },
  errorText: { color: TOKENS.red, fontSize: 13.5, marginTop: 12 },
  scoreHero: { textAlign: "center", padding: "1rem 0 2rem" },
  scoreNum: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 64, fontWeight: 700, color: TOKENS.ink, margin: 0 },
  scoreOf: { fontSize: 22, color: TOKENS.inkSoft },
  scoreLabel: { fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: TOKENS.accent, margin: "0 0 6px" },
  gateBox: { background: TOKENS.accentSoft, border: `1px solid ${TOKENS.accent}`, borderRadius: 14, padding: "1.5rem", textAlign: "center" },
  gateText: { fontSize: 15, color: TOKENS.ink, margin: "0 0 14px", fontWeight: 600 },
  emailRow: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  emailInput: { flex: "1 1 260px", maxWidth: 340, padding: "12px 14px", borderRadius: 10, border: `1px solid ${TOKENS.line}`, fontSize: 15, fontFamily: "'Inter', Arial, sans-serif" },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, margin: "24px 0" },
  metricCard: { background: TOKENS.paper, borderRadius: 12, padding: "1.25rem", textAlign: "center" },
  metricNum: { fontSize: 26, fontWeight: 700, color: TOKENS.ink, margin: "0 0 2px" },
  metricLabel: { fontSize: 12.5, color: TOKENS.inkSoft, margin: 0 },
  h2: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, margin: "28px 0 12px", color: TOKENS.ink },
  list: { fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.7, paddingLeft: 20, margin: 0 },
  readiness: { fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.6, margin: 0 },
  ctaCard: { background: TOKENS.ink, borderRadius: 20, padding: "2.5rem", margin: "40px 0 0", textAlign: "left" },
  ctaEyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accentSoft, textTransform: "uppercase", margin: "0 0 10px" },
  ctaHeading: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, color: "#fff", margin: "0 0 20px", lineHeight: 1.25 },
  ctaButton: { display: "inline-block", background: "#fff", color: TOKENS.accent, fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 10, textDecoration: "none" },
};

function resumeScorePrompt(resumeText) {
  return `You are an expert resume reviewer and ATS (Applicant Tracking System) specialist. Analyze this resume and score it honestly and specifically — do not inflate scores to be encouraging.

Resume text:
${resumeText}

Output STRICT, VALID JSON in exactly this shape:
{
  "overallScore": <integer 0-100>,
  "atsScore": <integer 0-100, how well this would parse and rank in an Applicant Tracking System>,
  "keywordScore": <integer 0-100, presence of strong, relevant, industry-standard keywords and skills>,
  "formattingScore": <integer 0-100, structure, consistency, scannability>,
"weakBulletPoints": ["up to 5 specific bullet points from the resume that are vague, passive, or lack measurable impact, PARAPHRASED in your own words rather than quoted verbatim, to avoid introducing special characters"],
  "missingSkills": ["up to 6 skills or qualifications commonly expected for this type of role that are absent from the resume"],
  "employerReadiness": "2-3 sentence honest assessment of how ready this resume is to be sent to employers today, and the single biggest thing to fix first"
}
Every string value must be valid JSON: escape any internal double quotes as \\", and do not include literal line breaks inside any string value. Return ONLY the JSON object, no markdown fences, no commentary.`;
}

async function callClaude(prompt, maxTokens = 1200) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Generation failed");
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}

export default function ATSCheckerTool() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function runCheck() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    setUnlocked(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const parseRes = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      if (!parseRes.ok || parseData.error) {
        throw new Error(parseData.error || "Could not read this file.");
      }

      let parsed;
      try {
        const text = await callClaude(resumeScorePrompt(parseData.text), 1200);
        parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch (parseErr) {
        const text2 = await callClaude(resumeScorePrompt(parseData.text), 1200);
        parsed = JSON.parse(text2.replace(/```json|```/g, "").trim());
      }
      setResult(parsed);
    } catch (e) {
      setError(e.message || "Something went wrong analyzing your resume.");
    } finally {
      setLoading(false);
    }
  }

  async function unlockResults(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    setEmailSending(true);
    setUnlocked(true);
    try {
      await fetch("/api/send-resume-score-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          overallScore: result.overallScore,
          atsScore: result.atsScore,
          keywordScore: result.keywordScore,
          formattingScore: result.formattingScore,
          weakBulletPoints: result.weakBulletPoints,
          missingSkills: result.missingSkills,
          employerReadiness: result.employerReadiness,
        }),
      });
    } catch (e) {
      console.error("send-resume-score-email failed:", e);
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div style={styles.page}>
      <a href="/" style={styles.back}>&larr; Back to eCareer Design</a>

      <p style={styles.eyebrow}>Free ATS Resume Checker</p>
      <h1 style={styles.h1}>See Exactly How Applicant Tracking Systems Score Your Resume</h1>
      <p style={styles.sub}>
        Upload your resume and get an instant Overall Score, ATS Score, Keyword Score, and Formatting Score —
        plus the specific bullet points and missing skills holding you back.
      </p>
      <p style={styles.trustLine}>Free. No account required. Takes about 30 seconds.</p>

      <div style={styles.card}>
        {!result && (
          <div style={styles.uploadBox}>
            <input
              type="file"
              id="atsFileInput"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="atsFileInput" style={styles.uploadLabel}>
              <p style={styles.uploadText}>{file ? file.name : "Click to upload your resume"}</p>
              <p style={styles.uploadSubtext}>PDF or Word (.docx)</p>
            </label>
            <button
              onClick={runCheck}
              disabled={!file || loading}
              style={{ ...styles.button, ...((!file || loading) ? styles.buttonDisabled : {}) }}
            >
              {loading ? "Analyzing your resume..." : "Check My Resume Score"}
            </button>
            {error && <p style={styles.errorText}>{error}</p>}
          </div>
        )}

        {result && (
          <div>
            <div style={styles.scoreHero}>
              <p style={styles.scoreLabel}>Overall Score</p>
              <p style={styles.scoreNum}>{result.overallScore}<span style={styles.scoreOf}>/100</span></p>
            </div>

            {!unlocked ? (
              <div style={styles.gateBox}>
                <p style={styles.gateText}>Enter your email to unlock your full ATS, Keyword &amp; Formatting breakdown</p>
                <form onSubmit={unlockResults} style={styles.emailRow}>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.emailInput}
                    required
                  />
                  <button type="submit" style={styles.button}>Unlock My Full Results</button>
                </form>
                {emailError && <p style={styles.errorText}>{emailError}</p>}
              </div>
            ) : (
              <div>
                <div style={styles.metricsGrid}>
                  <div style={styles.metricCard}>
                    <p style={styles.metricNum}>{result.atsScore}</p>
                    <p style={styles.metricLabel}>ATS Score</p>
                  </div>
                  <div style={styles.metricCard}>
                    <p style={styles.metricNum}>{result.keywordScore}</p>
                    <p style={styles.metricLabel}>Keyword Score</p>
                  </div>
                  <div style={styles.metricCard}>
                    <p style={styles.metricNum}>{result.formattingScore}</p>
                    <p style={styles.metricLabel}>Formatting Score</p>
                  </div>
                </div>

                {(result.weakBulletPoints || []).length > 0 && (
                  <>
                    <h2 style={styles.h2}>Weak Bullet Points</h2>
                    <ul style={styles.list}>
                      {result.weakBulletPoints.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </>
                )}

                {(result.missingSkills || []).length > 0 && (
                  <>
                    <h2 style={styles.h2}>Missing Skills</h2>
                    <ul style={styles.list}>
                      {result.missingSkills.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </>
                )}

                <h2 style={styles.h2}>Employer Readiness</h2>
                <p style={styles.readiness}>{result.employerReadiness}</p>
                {emailSending && <p style={styles.uploadSubtext}>Emailing your full results to {email}...</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.ctaCard}>
        <p style={styles.ctaEyebrow}>Want Us To Fix These For You?</p>
        <h2 style={styles.ctaHeading}>eCareer Design tailors your resume to any job posting — free to start.</h2>
        <a href="/" style={styles.ctaButton}>Explore eCareer Design &rarr;</a>
      </div>
    </div>
  );
}

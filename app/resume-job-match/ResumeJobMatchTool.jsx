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
  green: "#2F6F4E",
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
  fieldLabel: { fontSize: 13.5, fontWeight: 700, color: TOKENS.ink, margin: "0 0 8px", display: "block" },
  textarea: { width: "100%", minHeight: 160, padding: "12px 14px", borderRadius: 10, border: `1px solid ${TOKENS.line}`, fontSize: 14.5, fontFamily: "'Inter', Arial, sans-serif", color: TOKENS.ink, resize: "vertical", boxSizing: "border-box" },
  uploadBox: { border: `2px dashed ${TOKENS.line}`, borderRadius: 14, padding: "1.75rem 1.5rem", textAlign: "center", background: TOKENS.paper },
  uploadLabel: { cursor: "pointer", display: "block" },
  uploadText: { fontSize: 15, fontWeight: 600, color: TOKENS.ink, margin: "6px 0 4px" },
  uploadSubtext: { fontSize: 13, color: TOKENS.inkSoft, margin: 0 },
  fieldBlock: { marginBottom: 22 },
  button: {
    display: "inline-block", background: TOKENS.accent, color: "#fff", fontFamily: "'Inter', Arial, sans-serif",
    fontSize: 15, fontWeight: 600, padding: "13px 26px", borderRadius: 10, textDecoration: "none", border: "none", cursor: "pointer", marginTop: 6,
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
  h2: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, margin: "28px 0 12px", color: TOKENS.ink },
  list: { fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.7, paddingLeft: 20, margin: 0 },
  matchedTag: { display: "inline-block", background: "#E4F0E9", color: TOKENS.green, fontSize: 13.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, margin: "0 8px 8px 0" },
  missingTag: { display: "inline-block", background: TOKENS.accentSoft, color: TOKENS.red, fontSize: 13.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, margin: "0 8px 8px 0" },
  readiness: { fontSize: 15, color: TOKENS.inkSoft, lineHeight: 1.6, margin: 0 },
  ctaCard: { background: TOKENS.ink, borderRadius: 20, padding: "2.5rem", margin: "40px 0 0", textAlign: "left" },
  ctaEyebrow: { fontSize: 12.5, fontWeight: 700, letterSpacing: 0.6, color: TOKENS.accentSoft, textTransform: "uppercase", margin: "0 0 10px" },
  ctaHeading: { fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, color: "#fff", margin: "0 0 20px", lineHeight: 1.25 },
  ctaButton: { display: "inline-block", background: "#fff", color: TOKENS.accent, fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 10, textDecoration: "none" },
  startOverLink: { fontSize: 13.5, color: TOKENS.accent, textDecoration: "none", display: "inline-block", marginTop: 20 },
};

function matchScorePrompt(resumeText, jobDescription) {
  return `You are an experienced recruiter comparing a candidate's resume against a specific job posting to estimate fit.

Job posting text:
${jobDescription}

Candidate resume text:
${resumeText}

Evaluate how well the candidate's actual experience, skills, and qualifications from the resume match this specific job posting. Be realistic and specific — do not inflate the score to be encouraging.

Output STRICT, VALID JSON in exactly this shape:
{
  "score": <integer 0-100, overall match percentage>,
  "matchedSkills": ["up to 6 specific skills/qualifications from the posting that the resume clearly supports"],
  "missingSkills": ["up to 6 specific skills/qualifications from the posting that the resume does NOT clearly show"],
  "keywordGaps": ["up to 6 exact keywords or phrases from the job posting that are missing or underused in the resume, useful for passing ATS keyword matching"],
  "summary": "2-3 sentence honest assessment of fit, mentioning the strongest match and the biggest gap"
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

export default function ResumeJobMatchTool() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function runMatch() {
    if (!file || !jobDescription.trim()) return;
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
        const text = await callClaude(matchScorePrompt(parseData.text, jobDescription), 1200);
        parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch (parseErr) {
        const text2 = await callClaude(matchScorePrompt(parseData.text, jobDescription), 1200);
        parsed = JSON.parse(text2.replace(/```json|```/g, "").trim());
      }
      setResult(parsed);
    } catch (e) {
      setError(e.message || "Something went wrong comparing your resume to this job.");
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
      await fetch("/api/send-match-score-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          score: result.score,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
          keywordGaps: result.keywordGaps,
          summary: result.summary,
        }),
      });
    } catch (e) {
      console.error("send-match-score-email failed:", e);
    } finally {
      setEmailSending(false);
    }
  }

  function startOver() {
    setResult(null);
    setUnlocked(false);
    setError("");
  }

  return (
    <div style={styles.page}>
      <a href="/" style={styles.back}>&larr; Back to eCareer Design</a>

      <p style={styles.eyebrow}>Free Resume &amp; Job Description Match Checker</p>
      <h1 style={styles.h1}>See How Well Your Resume Matches Any Job Description</h1>
      <p style={styles.sub}>
        Paste a job posting and upload your resume to get an instant match score, the keywords you're
        missing, and the skills gaps standing between you and an interview.
      </p>
      <p style={styles.trustLine}>Free. No account required. Takes about 30 seconds.</p>

      <div style={styles.card}>
        {!result && (
          <div>
            <div style={styles.fieldBlock}>
              <label style={styles.fieldLabel} htmlFor="jobDescInput">Paste the job description</label>
              <textarea
                id="jobDescInput"
                style={styles.textarea}
                placeholder="Paste the full job posting text here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.fieldLabel}>Upload your resume</label>
              <div style={styles.uploadBox}>
                <input
                  type="file"
                  id="matchFileInput"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="matchFileInput" style={styles.uploadLabel}>
                  <p style={styles.uploadText}>{file ? file.name : "Click to upload your resume"}</p>
                  <p style={styles.uploadSubtext}>PDF or Word (.docx)</p>
                </label>
              </div>
            </div>

            <button
              onClick={runMatch}
              disabled={!file || !jobDescription.trim() || loading}
              style={{ ...styles.button, ...((!file || !jobDescription.trim() || loading) ? styles.buttonDisabled : {}) }}
            >
              {loading ? "Comparing your resume..." : "Get My Match Score"}
            </button>
            {error && <p style={styles.errorText}>{error}</p>}
          </div>
        )}

        {result && (
          <div>
            <div style={styles.scoreHero}>
              <p style={styles.scoreLabel}>Match Score</p>
              <p style={styles.scoreNum}>{result.score}<span style={styles.scoreOf}>/100</span></p>
            </div>

            {!unlocked ? (
              <div style={styles.gateBox}>
                <p style={styles.gateText}>Enter your email to unlock your matched skills, keyword gaps &amp; full breakdown</p>
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
                {(result.matchedSkills || []).length > 0 && (
                  <>
                    <h2 style={styles.h2}>What Matches</h2>
                    <div>
                      {result.matchedSkills.map((s, i) => <span key={i} style={styles.matchedTag}>{s}</span>)}
                    </div>
                  </>
                )}

                {(result.missingSkills || []).length > 0 && (
                  <>
                    <h2 style={styles.h2}>Missing Skills</h2>
                    <div>
                      {result.missingSkills.map((s, i) => <span key={i} style={styles.missingTag}>{s}</span>)}
                    </div>
                  </>
                )}

                {(result.keywordGaps || []).length > 0 && (
                  <>
                    <h2 style={styles.h2}>Keywords to Add for ATS</h2>
                    <ul style={styles.list}>
                      {result.keywordGaps.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  </>
                )}

                <h2 style={styles.h2}>Recruiter Take</h2>
                <p style={styles.readiness}>{result.summary}</p>
                {emailSending && <p style={styles.uploadSubtext}>Emailing your full results to {email}...</p>}
              </div>
            )}
            <a href="#" onClick={(e) => { e.preventDefault(); startOver(); }} style={styles.startOverLink}>
              &larr; Check a different job posting
            </a>
          </div>
        )}
      </div>

      <div style={styles.ctaCard}>
        <p style={styles.ctaEyebrow}>Want Us To Close These Gaps For You?</p>
        <h2 style={styles.ctaHeading}>eCareer Design tailors your resume to any job posting - free to start.</h2>
        <a href="/" style={styles.ctaButton}>Explore eCareer Design &rarr;</a>
      </div>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import PublicShell, { PhotoBand } from "../../components/public/PublicShell";
import { Faq, Section } from "../../components/public/Blocks";

export const ATS_FAQ = [
  { q: "What is an ATS score?", a: "An ATS score is a number that reflects how well your resume matches a job description and how cleanly it can be read by Applicant Tracking System software. This free ATS score checker calculates it instantly from your resume." },
  { q: "How do I calculate my ATS score?", a: "Upload your resume above and click \"Check My Resume Score.\" The tool analyzes your formatting, keywords, and structure and gives you an Overall Score, ATS Score, Keyword Score, and Formatting Score in about 30 seconds." },
  { q: "Is an ATS score checker the same as an ATS tracker?", a: "They're related but not identical. An ATS tracker generally refers to the software employers use to manage applications. An ATS score checker, like this one, checks your resume against that kind of system before you apply, so you can fix issues in advance." },
  { q: "Why did I get a low ATS score if I'm qualified for the job?", a: "A low score usually means formatting or keyword issues, not a lack of qualifications. Tables, text boxes, and non-standard section headings can confuse ATS parsing, and missing the exact terms from a job posting can lower your keyword score even when your real experience is a strong fit." },
  { q: "Is this ATS score checker really free?", a: "Yes. Checking your resume's ATS score is free and doesn't require an account." },
];

// Presentation only. State, the parse/score calls and the email send stay in ATSCheckerTool.jsx
// and arrive here as props, so this view cannot change how anything works.
export default function NewATSCheckerView({
  file, setFile, loading, error, result, email, setEmail, unlocked, emailSending, emailError,
  runCheck, unlockResults, startOver,
}) {
  useEffect(() => {
    const el = document.getElementById("check");
    if (!el || !result) return;
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  }, [result]);

  const canRun = !!file && !loading;
  const score = Math.max(0, Math.min(100, Number(result?.overallScore) || 0));

  return (
    <PublicShell>
      <PhotoBand
        src="/landing/resumes.jpg"
        priority
        shade="linear-gradient(90deg, rgba(13,26,43,0.9) 0%, rgba(13,26,43,0.7) 55%, rgba(13,26,43,0.45) 100%)"
      >
        <div className="np-wrap np-hero">
          <p className="np-eyebrow">Free ATS Score Checker</p>
          <h1>Check Your Resume&rsquo;s ATS Score <em>Free in 30 Seconds</em></h1>
          <p className="np-lead">
            Calculate your resume&rsquo;s ATS score instantly. Upload your resume to get an Overall Score, ATS Score,
            Keyword Score, and Formatting Score, plus the specific bullet points and missing skills holding you back.
          </p>
          <div className="np-pills">
            <span className="np-pill">No account required</span>
            <span className="np-pill">Your resume isn&rsquo;t stored</span>
            <span className="np-pill">Results in about 30 seconds</span>
          </div>
        </div>
      </PhotoBand>

      <div className="np-wrap">
        <div className="np-tool" id="check">
          {!result && (
            <div>
              <div className="np-field">
                <span className="np-label" id="np-file-label">Upload your resume</span>
                <label className={`np-upload${file ? " has-file" : ""}`} htmlFor="atsFileInput">
                  <input
                    type="file"
                    id="atsFileInput"
                    className="np-sr"
                    accept=".pdf,.doc,.docx"
                    aria-labelledby="np-file-label"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <strong>{file ? file.name : "Click to upload your resume"}</strong>
                  <span>{file ? "Click to choose a different file" : "PDF or Word (.docx)"}</span>
                </label>
              </div>
              <button type="button" className="np-btn np-btn-or" onClick={runCheck} disabled={!canRun}>
                {loading ? "Analyzing your resume..." : "Check My Resume Score"}
              </button>
              {error && <p className="np-err" role="alert">{error}</p>}
            </div>
          )}

          {result && (
            <div aria-live="polite">
              <div className="np-score-row">
                <div>
                  <p className="np-eyebrow">Overall Score</p>
                  <p className="np-score">{result.overallScore}<small>/100</small></p>
                </div>
                <div className="np-bar-wrap">
                  <div className="np-bar" role="img" aria-label={`Overall score ${score} out of 100`}>
                    <span style={{ width: `${score}%` }} />
                  </div>
                </div>
              </div>

              <div className="np-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginTop: 20 }}>
                {[["ATS Score", result.atsScore], ["Keyword Score", result.keywordScore], ["Formatting Score", result.formattingScore]].map(([l, v]) => (
                  <div className="np-card" key={l} style={{ textAlign: "center", padding: 18 }}>
                    <p className="np-score" style={{ fontSize: 40 }}>{v}</p>
                    <p style={{ fontSize: 13.5, color: "var(--np-muted)", marginTop: 4 }}>{l}</p>
                  </div>
                ))}
              </div>

              {(result.weakBulletPoints || []).length > 0 && (
                <>
                  <h2 className="np-h3">Weak Bullet Points</h2>
                  <ul className="np-list">{result.weakBulletPoints.map((b, i) => <li key={i}>{b}</li>)}</ul>
                </>
              )}

              {(result.missingSkills || []).length > 0 && (
                <>
                  <h2 className="np-h3">Missing Skills</h2>
                  <div className="np-chips">
                    {result.missingSkills.map((s, i) => <span key={i} className="np-chip miss">{s}</span>)}
                  </div>
                </>
              )}

              <h2 className="np-h3">Employer Readiness</h2>
              <p className="np-take">{result.employerReadiness}</p>

              {!unlocked ? (
                <div className="np-gate">
                  <p>Want a copy of this report for later? We&apos;ll email it to you.</p>
                  <form onSubmit={unlockResults} className="np-email-row">
                    <label className="np-sr" htmlFor="np-email">Your email address</label>
                    <input id="np-email" className="np-email" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <button type="submit" className="np-btn np-btn-navy">Email Me This Report</button>
                  </form>
                  {emailError && <p className="np-err" role="alert">{emailError}</p>}
                </div>
              ) : (
                <div className="np-gate">
                  <p style={{ marginBottom: 0 }}>
                    {emailSending ? `Sending your report to ${email}...` : `Sent! Check ${email} for your full report.`}
                  </p>
                </div>
              )}
              <button type="button" className="np-again" onClick={startOver}>&larr; Check a different resume</button>
            </div>
          )}
        </div>

        <Section eyebrow="Questions" title="Frequently Asked Questions" id="np-faq">
          <Faq items={ATS_FAQ} />
        </Section>
      </div>

      <PhotoBand
        src="/landing/skyline.jpg"
        className="np-cta"
        shade="linear-gradient(90deg, rgba(13,26,43,0.9) 0%, rgba(13,26,43,0.68) 60%, rgba(13,26,43,0.45) 100%)"
      >
        <div className="np-wrap np-cta-in">
          <p className="np-eyebrow">Want Us To Fix These For You?</p>
          <h2>eCareer Design tailors your resume to any job posting, free to start.</h2>
          <a href="/" className="np-btn np-btn-or">Explore eCareer Design &rarr;</a>
        </div>
      </PhotoBand>
    </PublicShell>
  );
}

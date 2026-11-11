"use client";
import { useEffect } from "react";
import PublicShell, { PhotoBand } from "../../components/public/PublicShell";

// Presentation only. State, the parse/score calls and the email send all stay in
// ResumeJobMatchTool.jsx and arrive here as props, so this view cannot change how anything works.
export default function NewResumeJobMatchView({
  file, setFile, jobDescription, setJobDescription,
  loading, error, result, email, setEmail, unlocked, emailSending, emailError,
  runMatch, unlockResults, startOver,
}) {
  // When the score arrives (or the user starts over), bring the card back into view.
  useEffect(() => {
    const el = document.getElementById("check");
    if (!el || !result) return;
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  }, [result]);

  const canRun = !!file && !!jobDescription.trim() && !loading;
  const score = Math.max(0, Math.min(100, Number(result?.score) || 0));

  return (
    <PublicShell>
      <PhotoBand
        src="/landing/compass.jpg"
        priority
        shade="linear-gradient(90deg, rgba(13,26,43,0.9) 0%, rgba(13,26,43,0.7) 55%, rgba(13,26,43,0.45) 100%)"
      >
        <div className="np-wrap np-hero">
          <p className="np-eyebrow">Free Resume &amp; Job Description Match Checker</p>
          <h1>See How Well Your Resume Matches <em>Any Job Description</em></h1>
          <p className="np-lead">
            Paste a job posting and upload your resume to get an instant match score, the keywords you&apos;re
            missing, and the skills gaps standing between you and an interview.
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
                <label className="np-label" htmlFor="jobDescInput">Paste the job description</label>
                <textarea
                  id="jobDescInput"
                  placeholder="Paste the full job posting text here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="np-field">
                <span className="np-label" id="np-file-label">Upload your resume</span>
                <label className={`np-upload${file ? " has-file" : ""}`} htmlFor="matchFileInput">
                  <input
                    type="file"
                    id="matchFileInput"
                    className="np-sr"
                    accept=".pdf,.doc,.docx"
                    aria-labelledby="np-file-label"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <strong>{file ? file.name : "Click to upload your resume"}</strong>
                  <span>{file ? "Click to choose a different file" : "PDF or Word (.docx)"}</span>
                </label>
              </div>

              <button type="button" className="np-btn np-btn-or" onClick={runMatch} disabled={!canRun}>
                {loading ? "Comparing your resume..." : "Get My Match Score"}
              </button>
              {error && <p className="np-err" role="alert">{error}</p>}
            </div>
          )}

          {result && (
            <div aria-live="polite">
              <div className="np-score-row">
                <div>
                  <p className="np-eyebrow">Match Score</p>
                  <p className="np-score">{result.score}<small>/100</small></p>
                </div>
                <div className="np-bar-wrap">
                  <div className="np-bar" role="img" aria-label={`Match score ${score} out of 100`}>
                    <span style={{ width: `${score}%` }} />
                  </div>
                </div>
              </div>

              {(result.matchedSkills || []).length > 0 && (
                <>
                  <h2 className="np-h3">What Matches</h2>
                  <div className="np-chips">
                    {result.matchedSkills.map((s, i) => <span key={i} className="np-chip ok">{s}</span>)}
                  </div>
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

              {(result.keywordGaps || []).length > 0 && (
                <>
                  <h2 className="np-h3">Keywords to Add for ATS</h2>
                  <div className="np-chips">
                    {result.keywordGaps.map((k, i) => <span key={i} className="np-chip kw">{k}</span>)}
                  </div>
                </>
              )}

              <h2 className="np-h3">Recruiter Take</h2>
              <p className="np-take">{result.summary}</p>

              {!unlocked ? (
                <div className="np-gate">
                  <p>Want a copy of this report for later? We&apos;ll email it to you.</p>
                  <form onSubmit={unlockResults} className="np-email-row">
                    <label className="np-sr" htmlFor="np-email">Your email address</label>
                    <input
                      id="np-email"
                      className="np-email"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
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
              <button type="button" className="np-again" onClick={startOver}>&larr; Check a different job posting</button>
            </div>
          )}
        </div>

        <section className="np-section" aria-labelledby="np-how">
          <p className="np-eyebrow">How it works</p>
          <h2 className="np-h2" id="np-how">Three steps, about 30 seconds</h2>
          <div className="np-steps">
            <div className="np-step">
              <div className="np-step-n" aria-hidden="true">1</div>
              <h3>Paste the job posting</h3>
              <p>Copy the full description of the job you want, exactly as it&apos;s written.</p>
            </div>
            <div className="np-step">
              <div className="np-step-n" aria-hidden="true">2</div>
              <h3>Upload your resume</h3>
              <p>A PDF or Word file. No account needed.</p>
            </div>
            <div className="np-step">
              <div className="np-step-n" aria-hidden="true">3</div>
              <h3>See your gaps</h3>
              <p>Get a match score, the skills you show, the ones you don&apos;t, and the keywords to add.</p>
            </div>
          </div>
        </section>
      </div>

      <PhotoBand
        src="/landing/skyline.jpg"
        className="np-cta"
        shade="linear-gradient(90deg, rgba(13,26,43,0.9) 0%, rgba(13,26,43,0.68) 60%, rgba(13,26,43,0.45) 100%)"
      >
        <div className="np-wrap np-cta-in">
          <p className="np-eyebrow">Want Us To Close These Gaps For You?</p>
          <h2>eCareer Design tailors your resume to any job posting - free to start.</h2>
          <a href="/" className="np-btn np-btn-or">Explore eCareer Design &rarr;</a>
        </div>
      </PhotoBand>
    </PublicShell>
  );
}

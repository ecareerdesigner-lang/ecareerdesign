"use client";
import Image from "next/image";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import {
  Award, Briefcase, Mail, MessageSquare, Sparkles, ClipboardCheck,
  ExternalLink, Loader2, X,
} from "lucide-react";
import { DASHBOARD_CSS } from "./dashboardStyles";

// Same families, weights and styles as app/layout.js, so Next reuses the font files that
// are already loaded. `variable` just exposes them to the scoped styles.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--nd-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--nd-body",
});

const WEEKLY_GOAL = 15;

// Presentation only. All state, data loading and actions stay in Dashboard (ECareerDesign.jsx)
// and arrive here as props, so this view cannot change how anything is saved or scored.
export default function NewDashboardView({
  greeting, firstName,
  statsLoaded, weeklyAppCount, newJobMatchCount, nextInterview, onPracticeInterview,
  showJobMatches, jobMatchesList, jobMatchesLoading, onToggleJobMatches,
  onResumeBuilder, onJobTailoring, onCoverLetter, onInterviewPrep, onInterviewCoach,
  match, recentProjects, onRemoveProject, relativeDate,
  onHome, onLogout, onManageSubscription,
}) {
  const applied = weeklyAppCount || 0;
  const pct = Math.min(100, Math.round((applied / WEEKLY_GOAL) * 100));
  const goalMet = applied >= WEEKLY_GOAL;

  const tools = [
    { title: "Resume Builder", text: "Build an ATS-friendly resume from your background.", icon: Award, onClick: onResumeBuilder },
    { title: "Job Tailoring", text: "Tailor your resume to a specific job posting.", icon: Briefcase, onClick: onJobTailoring },
    { title: "Cover Letter", text: "Write a cover letter matched to the posting.", icon: Mail, onClick: onCoverLetter },
    { title: "Interview Prep", text: "Get likely questions and STAR-style answers.", icon: MessageSquare, onClick: onInterviewPrep },
    { title: "Interview Coach", text: "Practice mock interviews and build your STAR stories.", icon: Sparkles, onClick: onInterviewCoach },
    { title: "Performance Review Writer", text: "Write a clear, specific performance review.", icon: ClipboardCheck, href: "/performance-review/new" },
  ];

  return (
    <div className={`nd ${display.variable} ${body.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_CSS }} />

      <header className="nd-nav">
        <div className="nd-nav-in">
          <button type="button" className="nd-brand" onClick={onHome} aria-label="eCareer Design dashboard">
            <span className="nd-mark" aria-hidden="true">e</span>
            <span className="nd-brand-name">eCareer Design</span>
          </button>
          <nav className="nd-nav-links" aria-label="Account">
            <button type="button" className="nd-navlink" onClick={onHome}>Dashboard</button>
            <button type="button" className="nd-navlink" onClick={onManageSubscription}>Manage subscription</button>
            <button type="button" className="nd-navlink" onClick={onLogout}>Log out</button>
          </nav>
        </div>
      </header>

      <main>
        <section className="nd-bg nd-dark" aria-labelledby="nd-greet">
          <div className="nd-bg-layer" aria-hidden="true">
            <Image src="/landing/skyline.jpg" alt="" fill sizes="100vw" />
          </div>
          <div
            className="nd-shade"
            aria-hidden="true"
            style={{ background: "linear-gradient(90deg, rgba(13,26,43,0.9) 0%, rgba(13,26,43,0.7) 55%, rgba(13,26,43,0.45) 100%)" }}
          />
          <div className="nd-wrap nd-hero">
            <p className="nd-eyebrow">Your career dashboard</p>
            <h1 id="nd-greet">
              {greeting}{firstName ? <>, <em>{firstName}</em></> : ""}.
            </h1>
            <p className="nd-lead">Here is where your week stands, and your next step.</p>
          </div>
        </section>

        <div className="nd-wrap">
          <div className="nd-stats" aria-live="polite">
            {!statsLoaded ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="nd-stat" aria-hidden="true">
                  <div className="nd-skel" style={{ height: 14, width: "50%" }} />
                  <div className="nd-skel" style={{ height: 40, width: "40%" }} />
                  <div className="nd-skel" style={{ height: 14, width: "75%" }} />
                </div>
              ))
            ) : (
              <>
                <div className="nd-stat">
                  <p className="nd-stat-label">Applications this week</p>
                  <p className="nd-stat-big">{applied} <small>of {WEEKLY_GOAL}</small></p>
                  <div
                    className={`nd-bar${goalMet ? " ok" : ""}`}
                    role="progressbar"
                    aria-label="Weekly application goal"
                    aria-valuemin={0}
                    aria-valuemax={WEEKLY_GOAL}
                    aria-valuenow={Math.min(applied, WEEKLY_GOAL)}
                  >
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <p className="nd-stat-note">
                    {goalMet ? "Weekly goal reached." : `${WEEKLY_GOAL - applied} to go to hit your weekly goal.`}
                  </p>
                </div>

                <div className="nd-stat blue">
                  <p className="nd-stat-label">New job matches</p>
                  <p className="nd-stat-big">{newJobMatchCount || 0}</p>
                  <p className="nd-stat-note">
                    {newJobMatchCount > 0
                      ? `new job${newJobMatchCount === 1 ? "" : "s"} matching your profile in the last 24 hours.`
                      : "Nothing new in the last 24 hours."}
                  </p>
                  <div className="nd-stat-actions">
                    <button
                      type="button"
                      className="nd-btn nd-btn-gh"
                      onClick={onToggleJobMatches}
                      aria-expanded={showJobMatches}
                      aria-controls="nd-matches"
                    >
                      {showJobMatches ? "Hide matches" : "View matches"}
                    </button>
                  </div>
                </div>

                <div className="nd-stat">
                  <p className="nd-stat-label">Next interview</p>
                  {nextInterview ? (
                    <>
                      <p className="nd-stat-big" style={{ fontSize: 26, lineHeight: 1.15 }}>
                        {nextInterview.company_name || nextInterview.job_title || "Upcoming interview"}
                      </p>
                      <p className="nd-stat-note">
                        {new Date(nextInterview.interview_at).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" })}
                      </p>
                      <div className="nd-stat-actions">
                        <button type="button" className="nd-btn nd-btn-or" onClick={onPracticeInterview}>
                          <Sparkles size={16} aria-hidden="true" /> Practice for this interview
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="nd-stat-big" style={{ fontSize: 26, lineHeight: 1.15 }}>None scheduled</p>
                      <p className="nd-stat-note">Practice any time in the Interview Coach.</p>
                      <div className="nd-stat-actions">
                        <button type="button" className="nd-btn nd-btn-gh" onClick={onInterviewCoach}>Open Interview Coach</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {showJobMatches && (
            <section id="nd-matches" className="nd-section" style={{ paddingTop: 40 }} aria-label="Job matches">
              <h2 className="nd-h2">Job matches</h2>
              <div className="nd-panel">
                {jobMatchesLoading ? (
                  <p className="nd-empty">Loading...</p>
                ) : jobMatchesList.length === 0 ? (
                  <p className="nd-empty">No matches found yet.</p>
                ) : (
                  jobMatchesList.map((job, i) => (
                    <div className="nd-row" key={i}>
                      <div className="nd-row-main">
                        <p className="nd-row-title">{job.job_title}</p>
                        <p className="nd-row-meta">{job.company_name || "—"} · {job.source}</p>
                      </div>
                      {job.job_url && (
                        <a className="nd-btn nd-btn-gh" href={job.job_url} target="_blank" rel="noopener noreferrer">
                          Apply <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          <section className="nd-section" aria-labelledby="nd-tools-h">
            <p className="nd-eyebrow">What would you like to do today?</p>
            <h2 className="nd-h2" id="nd-tools-h">Start something</h2>
            <div className="nd-tools">
              {tools.map(({ title, text, icon: Icon, onClick, href }) => {
                const inner = (
                  <>
                    <span className="nd-ico" aria-hidden="true"><Icon size={22} /></span>
                    <span>
                      <span className="nd-tool-t">{title}</span>
                      <span className="nd-tool-d">{text}</span>
                    </span>
                  </>
                );
                return href ? (
                  <Link key={title} href={href} className="nd-tool">{inner}</Link>
                ) : (
                  <button key={title} type="button" className="nd-tool" onClick={onClick}>{inner}</button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="nd-bg nd-dark nd-match" aria-labelledby="nd-match-h">
          <div className="nd-bg-layer" aria-hidden="true">
            <Image src="/landing/resumes.jpg" alt="" fill sizes="100vw" />
          </div>
          <div
            className="nd-shade"
            aria-hidden="true"
            style={{ background: "linear-gradient(90deg, rgba(13,26,43,0.86) 0%, rgba(13,26,43,0.6) 100%)" }}
          />
          <div className="nd-wrap">
            <div className="nd-match-grid">
              <div className="nd-match-copy">
                <p className="nd-eyebrow">Resume Match Score</p>
                <h2 id="nd-match-h">How close are you to <em style={{ color: "var(--nd-orange)" }}>this job?</em></h2>
                <p>Paste a job posting. You get a score against your background, the skills you already match, and what is missing.</p>
              </div>

              <div className="nd-form">
                <div className="nd-fields">
                  <div className="nd-field">
                    <label htmlFor="nd-title">Job title (optional)</label>
                    <input id="nd-title" type="text" value={match.title} onChange={(e) => match.setTitle(e.target.value)} />
                  </div>
                  <div className="nd-field">
                    <label htmlFor="nd-company">Company (optional)</label>
                    <input id="nd-company" type="text" value={match.company} onChange={(e) => match.setCompany(e.target.value)} />
                  </div>
                </div>
                <div className="nd-field">
                  <label htmlFor="nd-desc">Job posting</label>
                  <textarea
                    id="nd-desc"
                    rows={5}
                    placeholder="Paste the job posting text here..."
                    value={match.description}
                    onChange={(e) => match.setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    className="nd-btn nd-btn-navy"
                    onClick={match.onRun}
                    disabled={match.loading || !match.description.trim()}
                  >
                    {match.loading ? <Loader2 size={16} className="cf-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
                    {match.loading ? "Scoring..." : "Check match"}
                  </button>
                </div>

                {match.error && <p className="nd-err" role="alert">{match.error}</p>}

                {match.result && (
                  <div className="nd-result" aria-live="polite">
                    <p className="nd-score">{match.result.score}%</p>
                    <div className="nd-bar" role="img" aria-label={`Match score ${match.result.score} percent`}>
                      <span style={{ width: `${Math.max(0, Math.min(100, Number(match.result.score) || 0))}%` }} />
                    </div>
                    <p style={{ color: "var(--nd-muted)" }}>{match.result.summary}</p>
                    <div>
                      <p className="nd-chip-h" style={{ color: "var(--nd-green)" }}>Matched</p>
                      <div className="nd-chips">
                        {(match.result.matchedSkills || []).map((s, i) => <span key={i} className="nd-chip ok">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <p className="nd-chip-h" style={{ color: "var(--nd-red)" }}>Missing</p>
                      <div className="nd-chips">
                        {(match.result.missingSkills || []).map((s, i) => <span key={i} className="nd-chip miss">{s}</span>)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="nd-wrap">
          <section className="nd-section" style={{ paddingTop: 64 }} aria-labelledby="nd-proj-h">
            <p className="nd-eyebrow">Pick up where you left off</p>
            <h2 className="nd-h2" id="nd-proj-h">Recent projects</h2>
            {recentProjects.length === 0 ? (
              <p className="nd-sub" style={{ marginTop: 12 }}>Nothing yet. Your finished resumes and applications will show up here.</p>
            ) : (
              <div className="nd-panel">
                {recentProjects.map((p) => (
                  <div className="nd-row" key={p.id}>
                    <div className="nd-row-main">
                      <p className="nd-row-title">{p.title}</p>
                    </div>
                    <div className="nd-meta">
                      <span className="nd-proj-type">{p.type}</span>
                      <span className="nd-proj-date">{relativeDate(p.date)}</span>
                      <button
                        type="button"
                        className="nd-x"
                        onClick={() => onRemoveProject(p.id)}
                        aria-label={`Remove ${p.title}`}
                        title="Remove"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="nd-foot">
        <Link href="/blog">Blog</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/privacy">Privacy Notice</Link>
        <Link href="/terms">Terms of Use</Link>
        <a href="mailto:hello@ecareerdesign.net">Contact Us</a>
      </footer>
    </div>
  );
}

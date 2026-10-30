"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { LANDING_CSS } from "./landingStyles";

// Same families, weights and styles as app/layout.js, so Next reuses the font files that
// are already loaded instead of adding new ones. `variable` just exposes them to landing.css.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--nl-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--nl-body",
});

const TICKER = [
  "USAJOBS, Adzuna & Jooble search",
  "STAR responses",
  "ATS scoring",
  "Voice mock interviews",
  "Tailored cover letters",
  "Performance reviews",
];

const FAQS = [
  {
    q: "Will it sound like AI wrote it?",
    a: "It starts from your real background and the exact posting, so the result is your experience, sharpened. You review and edit everything before it goes anywhere.",
  },
  {
    q: "Is it only for federal jobs?",
    a: "No. Paste a posting from any employer and it tailors your resume, cover letter and answers to that role. If you are applying for federal positions, it also searches USAJOBS directly and writes STAR responses for those postings.",
  },
  {
    q: "Do I have to start from scratch each time?",
    a: "No. You enter your background once, then every new application is built from it and shaped to the posting you paste in.",
  },
  {
    q: "Is my resume kept private?",
    a: "Your information is used to build your applications. The Privacy Notice explains exactly how it is handled.",
    privacy: true,
  },
  {
    q: "Can I cancel anytime?",
    a: "Premium is month to month. If you would rather not subscribe at all, the 30-Day Pass is one payment with nothing to cancel.",
  },
];

const BLOG = [
  ["/blog/how-to-find-keywords-in-job-description", "Job Description Keywords: How to Find the Right Ones"],
  ["/blog/how-to-tailor-your-resume-to-a-job-description", "Tailor Your Resume to a Job Description in 10 Minutes"],
  ["/blog/resume-match-score-explained", "What Is a Resume Match Score? (And How to Raise It)"],
  ["/blog/how-to-beat-applicant-tracking-systems", "How to Beat Applicant Tracking Systems (ATS Guide)"],
  ["/blog/how-to-write-resume-accomplishments", "How to Write Resume Accomplishments (With Examples)"],
];

function BgImage({ src, position = "center", shade, priority = false }) {
  return (
    <div className="nl-bg-layer nl-px" aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        quality={70}
        priority={priority}
        style={{ objectFit: "cover", objectPosition: position }}
      />
      <div className="nl-shade" style={{ background: shade }} />
    </div>
  );
}

/* Small illustrations for the toolkit cards */
function ArtScan() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="220" fill="#1F3B5C" />
      <circle cx="330" cy="30" r="130" fill="#F2660A" fillOpacity="0.22" />
      <rect x="125" y="26" width="150" height="176" rx="10" fill="#EEF0EC" />
      <rect x="146" y="48" width="70" height="10" rx="5" fill="#2F5D8F" />
      <rect x="146" y="72" width="108" height="7" rx="3.5" fill="#C5CEC6" />
      <rect x="146" y="90" width="96" height="7" rx="3.5" fill="#C5CEC6" />
      <rect x="146" y="108" width="108" height="14" rx="4" fill="#F2660A" fillOpacity="0.55" />
      <rect x="146" y="132" width="88" height="7" rx="3.5" fill="#C5CEC6" />
      <rect x="146" y="150" width="100" height="7" rx="3.5" fill="#C5CEC6" />
      <circle cx="258" cy="128" r="42" fill="#FFFFFF" fillOpacity="0.14" stroke="#F2660A" strokeWidth="8" />
      <line x1="289" y1="158" x2="326" y2="195" stroke="#F2660A" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}
function ArtBuilder() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="220" fill="#274A72" />
      <circle cx="60" cy="200" r="140" fill="#F2660A" fillOpacity="0.2" />
      <rect x="115" y="26" width="150" height="176" rx="10" fill="#EEF0EC" />
      <rect x="135" y="46" width="48" height="48" rx="8" fill="#2F5D8F" />
      <rect x="195" y="52" width="56" height="9" rx="4.5" fill="#16283D" />
      <rect x="195" y="70" width="44" height="7" rx="3.5" fill="#C5CEC6" />
      <rect x="135" y="110" width="116" height="7" rx="3.5" fill="#C5CEC6" />
      <rect x="135" y="128" width="100" height="7" rx="3.5" fill="#C5CEC6" />
      <rect x="135" y="146" width="112" height="7" rx="3.5" fill="#C5CEC6" />
      <rect x="135" y="164" width="80" height="7" rx="3.5" fill="#C5CEC6" />
      <g transform="rotate(35 300 110)">
        <rect x="289" y="34" width="22" height="108" rx="4" fill="#F2660A" />
        <rect x="289" y="34" width="22" height="16" rx="4" fill="#FFB07A" />
        <polygon points="289,142 311,142 300,170" fill="#EEF0EC" />
        <polygon points="295,158 305,158 300,170" fill="#16283D" />
      </g>
    </svg>
  );
}
function ArtStar() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="220" fill="#1F3B5C" />
      <circle cx="340" cy="190" r="130" fill="#F2660A" fillOpacity="0.2" />
      <line x1="80" y1="110" x2="320" y2="110" stroke="#C9D2DD" strokeWidth="3" strokeDasharray="6 6" />
      <rect x="40" y="78" width="64" height="64" rx="14" fill="#EEF0EC" />
      <rect x="127" y="78" width="64" height="64" rx="14" fill="#EEF0EC" />
      <rect x="214" y="78" width="64" height="64" rx="14" fill="#EEF0EC" />
      <rect x="301" y="78" width="64" height="64" rx="14" fill="#F2660A" />
      <g fontFamily="Georgia, serif" fontWeight="700" fontSize="34" textAnchor="middle">
        <text x="72" y="123" fill="#2F5D8F">S</text>
        <text x="159" y="123" fill="#2F5D8F">T</text>
        <text x="246" y="123" fill="#2F5D8F">A</text>
        <text x="333" y="123" fill="#0D1A2B">R</text>
      </g>
    </svg>
  );
}
function ArtLetter() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="220" fill="#274A72" />
      <circle cx="70" cy="40" r="130" fill="#F2660A" fillOpacity="0.2" />
      <rect x="105" y="52" width="190" height="130" rx="12" fill="#EEF0EC" />
      <polyline points="105,62 200,130 295,62" fill="none" stroke="#C5CEC6" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="200" cy="132" r="19" fill="#F2660A" />
      <circle cx="200" cy="132" r="9" fill="#FFB07A" />
    </svg>
  );
}
function ArtMic() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="220" fill="#16283D" />
      <circle cx="330" cy="40" r="130" fill="#F2660A" fillOpacity="0.28" />
      <path d="M118 56 a28 28 0 0 0 0 76" fill="none" stroke="#C9D2DD" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
      <path d="M282 56 a28 28 0 0 1 0 76" fill="none" stroke="#C9D2DD" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
      <rect x="170" y="30" width="60" height="104" rx="30" fill="#EEF0EC" />
      <line x1="182" y1="62" x2="218" y2="62" stroke="#C5CEC6" strokeWidth="5" strokeLinecap="round" />
      <line x1="182" y1="80" x2="218" y2="80" stroke="#C5CEC6" strokeWidth="5" strokeLinecap="round" />
      <line x1="182" y1="98" x2="218" y2="98" stroke="#C5CEC6" strokeWidth="5" strokeLinecap="round" />
      <path d="M148 108 a52 52 0 0 0 104 0" fill="none" stroke="#F2660A" strokeWidth="8" strokeLinecap="round" />
      <line x1="200" y1="160" x2="200" y2="190" stroke="#F2660A" strokeWidth="8" strokeLinecap="round" />
      <line x1="168" y1="196" x2="232" y2="196" stroke="#F2660A" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
function ArtAward() {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="220" fill="#16283D" />
      <circle cx="70" cy="190" r="140" fill="#F2660A" fillOpacity="0.26" />
      <circle cx="200" cy="110" r="82" fill="none" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="3" />
      <circle cx="200" cy="110" r="68" fill="#FFFFFF" fillOpacity="0.06" />
      <polygon
        points="200,58 212.9,92.2 249.5,93.9 220.9,116.8 230.6,152.1 200,132 169.4,152.1 179.1,116.8 150.5,93.9 187.1,92.2"
        fill="#F2660A"
        stroke="#FFB07A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NewLanding({
  authChecked,
  currentUser,
  isPremium,
  onLogin,
  onLogout,
  onManageSubscription,
  onScan,
  onBuilder,
  onJobSearch,
  onPricing,
  onPremiumCta,
}) {
  const [openFaq, setOpenFaq] = useState(0);
  const hasPremium = !!(currentUser && isPremium);

  return (
    <div className={`nl ${display.variable} ${body.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      {/* Sticky navigation */}
      <header className="nl-nav">
        <div className="nl-nav-in">
          <a href="#top" className="nl-brand" aria-label="eCareer Design home">
            <span className="nl-mark" aria-hidden="true">e</span>
            <span className="nl-brand-name">eCareer Design</span>
          </a>
          <nav className="nl-nav-links" aria-label="Main">
            <a className="nl-navlink nl-navhide" href="#how">How it works</a>
            <a className="nl-navlink nl-navhide" href="#tools">Toolkit</a>
            <a className="nl-navlink nl-navhide" href="#pricing">Pricing</a>
            <a className="nl-navlink nl-navhide" href="#faq">FAQ</a>
            {authChecked && (currentUser ? (
              <>
                {isPremium && (
                  <button type="button" className="nl-navlink nl-navhide" onClick={onManageSubscription}>Manage subscription</button>
                )}
                <button type="button" className="nl-navlink nl-navhide" onClick={onLogout}>Log out</button>
              </>
            ) : (
              <button type="button" className="nl-navlink nl-navhide" onClick={onLogin}>Log in</button>
            ))}
            <button type="button" className="nl-btn nl-btn-or" style={{ minHeight: 40, padding: "8px 20px" }} onClick={onScan}>
              Free resume scan
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="nl-bg nl-dark">
        <BgImage
          src="/landing/desk.jpg"
          priority
          shade="linear-gradient(90deg, rgba(13,26,43,0.86) 0%, rgba(13,26,43,0.56) 55%, rgba(13,26,43,0.3) 100%)"
        />
        <div className="nl-wrap nl-bg-content">
          <div className="nl-hero-in">
            <div className="nl-hero-copy">
              <span className="nl-pill">AI resume builder · Free 30-second scan</span>
              <h1 className="nl-h1">
                Your resume, rebuilt for the job you <em>actually want.</em>
              </h1>
              <p className="nl-lead" style={{ maxWidth: 540 }}>
                Upload your resume and see your ATS, keyword and formatting scores in seconds. Then paste any job posting and get a tailored resume, cover letter and interview answers built from one background you enter once.
              </p>
              <div className="nl-actions">
                <button type="button" className="nl-btn nl-btn-or" style={{ padding: "15px 28px", fontSize: 17 }} onClick={onScan}>
                  Scan my resume free
                </button>
                <Link href="/resume-job-match" className="nl-btn nl-btn-ol" style={{ padding: "15px 26px", fontSize: 17 }}>
                  Check a job match
                </Link>
              </div>
              <p className="nl-fine">No credit card. Works for any posting from any employer.</p>
            </div>

            <div className="nl-card-wrap">
              <div className="nl-report" role="img" aria-label="Sample readiness report: overall score 72, ATS 81, keywords 58, formatting 76">
                <div className="nl-report-head">
                  <span className="nl-display" style={{ fontSize: 19 }}>Readiness report</span>
                  <span className="nl-tag">Sample</span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
                  <span className="nl-bignum">72</span>
                  <span style={{ paddingBottom: 6, color: "#3C5069", fontSize: 15 }}>
                    Overall score<br />Solid base, with fixable gaps
                  </span>
                </div>
                <div className="nl-stack" style={{ gap: 12 }}>
                  <div className="nl-bar-row"><span>ATS</span><span className="nl-bar"><i style={{ width: "81%", background: "#2F5D8F" }} /></span><b>81</b></div>
                  <div className="nl-bar-row"><span>Keywords</span><span className="nl-bar"><i style={{ width: "58%", background: "#F2660A" }} /></span><b>58</b></div>
                  <div className="nl-bar-row"><span>Formatting</span><span className="nl-bar"><i style={{ width: "76%", background: "#2F5D8F" }} /></span><b>76</b></div>
                </div>
                <div className="nl-stack" style={{ gap: 10, borderTop: "1px solid #E3E8E2", paddingTop: 18 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#3C5069", textTransform: "uppercase", letterSpacing: "0.06em" }}>Holding you back</span>
                  <div className="nl-flag" style={{ background: "#FDE3CC" }}>
                    &ldquo;Responsible for various projects and team tasks.&rdquo;{" "}
                    <span style={{ fontWeight: 600, color: "#7A3300" }}>Vague, no result</span>
                  </div>
                  <div className="nl-flag" style={{ background: "#E8EEF4" }}>
                    <b>Missing from the posting:</b> stakeholder reporting, SQL, Agile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="nl-ticker" aria-label="What's included">
        <div className="nl-ticker-track">
          <div className="nl-ticker-group">
            {TICKER.map((t) => (
              <span className="nl-ticker-item" key={t}>{t}<span className="nl-diamond" /></span>
            ))}
          </div>
          <div className="nl-ticker-group" aria-hidden="true">
            {TICKER.map((t) => (
              <span className="nl-ticker-item" key={`dup-${t}`}>{t}<span className="nl-diamond" /></span>
            ))}
          </div>
        </div>
      </div>

      {/* Problem */}
      <section className="nl-bg nl-dark">
        <BgImage
          src="/landing/resumes.jpg"
          position="center bottom"
          shade="linear-gradient(180deg, rgba(13,26,43,0.8) 0%, rgba(13,26,43,0.64) 100%)"
        />
        <div className="nl-wrap nl-bg-content nl-section" style={{ display: "flex", flexWrap: "wrap", gap: 48, paddingTop: 110, paddingBottom: 110 }}>
          <div className="nl-rv nl-stack" style={{ flex: "1 1 420px", minWidth: 0, gap: 20 }}>
            <span className="nl-eyebrow">Why you&rsquo;re not hearing back</span>
            <h2 className="nl-h2" style={{ fontSize: "clamp(34px, 4.4vw, 56px)" }}>Your experience is strong. Your resume isn&rsquo;t saying it.</h2>
          </div>
          <div className="nl-rv nl-stack" style={{ flex: "1 1 420px", minWidth: 0, gap: 22 }}>
            <p className="nl-lead">Software skims for keywords. Hiring managers skim for proof. A generic resume loses both audiences before anyone reads past the first line.</p>
            <p className="nl-lead">eCareer Design rewrites your background around each posting, so every application uses the language of the role and the results behind it.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["Keywords the posting uses", "Results you can verify", "A format every system reads"].map((c) => (
                <span key={c} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "8px 16px", fontSize: 15, fontWeight: 500 }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="nl-bg nl-dark">
        <BgImage
          src="/landing/compass.jpg"
          position="70% center"
          shade="linear-gradient(180deg, rgba(13,26,43,0.74) 0%, rgba(13,26,43,0.52) 100%)"
        />
        <div className="nl-wrap nl-bg-content nl-section nl-stack" style={{ gap: 40 }}>
          <div className="nl-rv nl-stack" style={{ gap: 14, maxWidth: 680 }}>
            <span className="nl-eyebrow">Who it&rsquo;s for</span>
            <h2 className="nl-h2">Wherever your next move is</h2>
            <p className="nl-lead">Enter your background once. Every resume, cover letter and interview answer starts from it.</p>
          </div>
          <div className="nl-grid">
            <div className="nl-rv nl-aud" style={{ color: "#16283D" }}>
              <span className="k">Changing careers</span>
              <h3>Reframe what you&rsquo;ve done</h3>
              <p>Translate skills from one field into the language of another, with a match score before you apply.</p>
            </div>
            <div className="nl-rv nl-aud or" style={{ color: "#16283D" }}>
              <span className="k">Starting or returning</span>
              <h3>Build from a blank page</h3>
              <p>Turn coursework, projects and gaps in your history into a clean, ATS-friendly resume in minutes.</p>
            </div>
            <div className="nl-rv nl-aud" style={{ color: "#16283D" }}>
              <span className="k">Moving up</span>
              <h3>Make the case for the next level</h3>
              <p>Tailored applications and polished performance reviews that put your results in front of decision-makers.</p>
            </div>
            <div className="nl-rv nl-aud dk">
              <span className="k">Public sector &amp; military</span>
              <h3>Federal roles, covered</h3>
              <p>Search USAJOBS directly and get STAR responses for any posting, alongside every private-sector tool.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="nl-section" style={{ background: "#E3E8E2" }}>
        <div className="nl-wrap nl-stack" style={{ gap: 40, padding: 0 }}>
          <div className="nl-rv nl-stack" style={{ gap: 14, maxWidth: 680 }}>
            <span className="nl-eyebrow">See the difference</span>
            <h2 className="nl-h2">Same experience, sharper story</h2>
          </div>
          <div className="nl-ba">
            <div className="bf nl-rv">
              <div className="row"><span style={{ fontWeight: 600, color: "#3C5069" }}>Before</span><span className="pct">41%</span></div>
              <blockquote>&ldquo;Responsible for managing client accounts and working with teams on various projects.&rdquo;</blockquote>
            </div>
            <div className="af nl-rv">
              <div className="row"><span style={{ fontWeight: 600, color: "#C9D2DD" }}>After tailoring to the posting</span><span className="pct">87%</span></div>
              <blockquote>
                &ldquo;Grew a <b>28-account portfolio to $1.9M</b> in annual revenue, resolving escalations <b>35% faster</b> and onboarding <b>4 new teammates</b>.&rdquo;
              </blockquote>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "#3C5069" }}>Example shown for illustration. Your match score depends on your experience and the posting.</p>
        </div>
      </section>

      {/* Toolkit */}
      <section id="tools" className="nl-section">
        <div className="nl-wrap nl-tools" style={{ padding: 0 }}>
          <div className="nl-tools-side">
            <span className="nl-eyebrow">The toolkit</span>
            <h2 className="nl-h2">Everything between you and the offer</h2>
            <p className="nl-lead">Start with the free essentials. Add Premium when you want to move faster.</p>
            <p style={{ fontSize: 16, color: "#3C5069" }}>
              <b style={{ color: "#16283D" }}>Also included:</b> job search across USAJOBS, Adzuna and Jooble; resume match scoring; and a career dashboard to track your search.
            </p>
            <div className="nl-actions">
              <button type="button" className="nl-btn nl-btn-navy" onClick={onScan}>Try the free scan</button>
              <button type="button" className="nl-btn nl-btn-gh" onClick={onJobSearch}>Search jobs</button>
            </div>
          </div>

          <div className="nl-tools-list">
            <article className="nl-tool nl-rv">
              <ArtScan />
              <div className="nl-tool-body">
                <span className="nl-badge">Free</span>
                <h3>Readiness Scan</h3>
                <p>An instant, honest read on your resume: overall, ATS, keyword and formatting scores, plus weak bullets and missing skills.</p>
                <button type="button" className="nl-tool-link" onClick={onScan}>Run the free scan &rarr;</button>
              </div>
            </article>
            <article className="nl-tool nl-rv">
              <ArtBuilder />
              <div className="nl-tool-body">
                <span className="nl-badge">Free</span>
                <h3>Resume Builder</h3>
                <p>Build a clean, ATS-friendly resume in minutes from the background you enter once.</p>
                <button type="button" className="nl-tool-link" onClick={() => onBuilder("resume")}>Open the Resume Builder &rarr;</button>
              </div>
            </article>
            <article className="nl-tool nl-rv">
              <ArtStar />
              <div className="nl-tool-body">
                <span className="nl-badge">Free</span>
                <h3>STAR Job Tailoring</h3>
                <p>Paste any posting and get STAR responses shaped to exactly what that hiring team is looking for.</p>
                <button type="button" className="nl-tool-link" onClick={() => onBuilder("application")}>Tailor to a job posting &rarr;</button>
              </div>
            </article>
            <article className="nl-tool nl-rv">
              <ArtLetter />
              <div className="nl-tool-body">
                <span className="nl-badge">Free</span>
                <h3>Cover Letters</h3>
                <p>A matching cover letter for every application, written in your voice instead of a template&rsquo;s.</p>
                <button type="button" className="nl-tool-link" onClick={() => onBuilder("coverletter")}>Write a cover letter &rarr;</button>
              </div>
            </article>
            <article className="nl-tool dk nl-rv">
              <ArtMic />
              <div className="nl-tool-body">
                <span className="nl-badge pr">Premium</span>
                <h3>Interview Coach</h3>
                <p>Pull out your best career stories, then run adaptive mock interviews by voice with AI scoring.</p>
                <button type="button" className="nl-tool-link" onClick={onPremiumCta}>{hasPremium ? "Open your dashboard" : "See Premium plans"} &rarr;</button>
              </div>
            </article>
            <article className="nl-tool dk nl-rv">
              <ArtAward />
              <div className="nl-tool-body">
                <span className="nl-badge pr">Premium</span>
                <h3>Performance Review Writer</h3>
                <p>Polished, first-person reviews for mid-year, end-of-year or end-of-position evaluations.</p>
                <button type="button" className="nl-tool-link" onClick={onPremiumCta}>{hasPremium ? "Open your dashboard" : "See Premium plans"} &rarr;</button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="nl-bg nl-dark">
        <BgImage
          src="/landing/stones.jpg"
          shade="linear-gradient(180deg, rgba(13,26,43,0.72) 0%, rgba(13,26,43,0.4) 60%, rgba(13,26,43,0.28) 100%)"
        />
        <div className="nl-wrap nl-bg-content nl-section nl-stack" style={{ gap: 48, paddingTop: 110, paddingBottom: 110 }}>
          <div className="nl-rv nl-stack" style={{ gap: 14, maxWidth: 680 }}>
            <span className="nl-eyebrow">How it works</span>
            <h2 className="nl-h2" style={{ fontSize: "clamp(32px, 4.2vw, 54px)" }}>Three steps, then apply with confidence</h2>
          </div>
          <div className="nl-steps">
            <div className="nl-step nl-rv"><span className="n">1</span><h3>Enter your background once</h3><p>Upload your resume or type it in. That&rsquo;s the last time you start from scratch.</p></div>
            <div className="nl-step nl-rv"><span className="n">2</span><h3>Paste any job posting</h3><p>From any employer or job board. See your match score and exactly what&rsquo;s missing.</p></div>
            <div className="nl-step nl-rv"><span className="n">3</span><h3>Get your full application</h3><p>A tailored resume, STAR answers and a cover letter, ready for you to review and send.</p></div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="nl-section">
        <div className="nl-wrap nl-stack" style={{ gap: 40, padding: 0 }}>
          <div className="nl-rv nl-stack" style={{ gap: 14, maxWidth: 680 }}>
            <span className="nl-eyebrow">Pricing</span>
            <h2 className="nl-h2">Start free. Upgrade when you&rsquo;re ready.</h2>
          </div>
          <div className="nl-plans">
            <div className="nl-plan nl-rv">
              <div className="nl-stack" style={{ gap: 4 }}>
                <span className="name">Free</span>
                <span className="price">$0</span>
                <span className="sub">Everything you need to build a standout application.</span>
              </div>
              <ul className="nl-chk">
                <li>Readiness Scan</li><li>Resume Builder</li><li>STAR Job Tailoring</li><li>Cover Letters</li><li>Job search across USAJOBS, Adzuna &amp; Jooble</li>
              </ul>
              <button type="button" className="nl-btn nl-btn-gh" onClick={onScan}>Get started free</button>
            </div>
            <div className="nl-plan feat nl-rv">
              <div className="nl-stack" style={{ gap: 4 }}>
                <span className="name">Premium</span>
                <span className="price">$9.99 <small>/ month</small></span>
                <span className="sub">For the long search. Prep smarter, track everything.</span>
              </div>
              <ul className="nl-chk">
                <li>Everything in Free</li><li>Career Dashboard &amp; weekly goals</li><li>Voice Interview Coach</li><li>Resume Match Scoring</li><li>Performance Review Writer</li>
              </ul>
              <button type="button" className="nl-btn nl-btn-or" onClick={onPremiumCta}>{hasPremium ? "Go to dashboard" : "Subscribe"}</button>
            </div>
            <div className="nl-plan nl-rv">
              <div className="nl-stack" style={{ gap: 4 }}>
                <span className="name">30-Day Pass</span>
                <span className="price">$15.99 <small>one time</small></span>
                <span className="sub">Full Premium for 30 days. Nothing to cancel.</span>
              </div>
              <ul className="nl-chk">
                <li>Everything in Free</li><li>Career Dashboard &amp; daily job matches</li><li>Voice Interview Coach</li><li>Resume Match Scoring</li><li>Performance Review Writer</li>
              </ul>
              <button type="button" className="nl-btn nl-btn-gh" onClick={onPricing}>Get the 30-Day Pass</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="nl-section" style={{ background: "#fff", borderTop: "1px solid #D7DBD6" }}>
        <div className="nl-stack" style={{ maxWidth: 860, margin: "0 auto", gap: 32 }}>
          <div className="nl-rv nl-stack" style={{ gap: 14 }}>
            <span className="nl-eyebrow">Questions</span>
            <h2 className="nl-h2">Straight answers</h2>
          </div>
          <div className="nl-faq">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div className="nl-faq-item" key={f.q}>
                  <button
                    type="button"
                    className="nl-faq-q"
                    aria-expanded={open}
                    aria-controls={`nl-faq-a-${i}`}
                    onClick={() => setOpenFaq(open ? -1 : i)}
                  >
                    <span>{f.q}</span>
                    <span className="ic" aria-hidden="true">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <p className="nl-faq-a" id={`nl-faq-a-${i}`}>
                      {f.a}
                      {f.privacy && <> <Link href="/privacy" style={{ color: "#2F5D8F" }}>Read the Privacy Notice</Link>.</>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blog (kept from the previous homepage for internal linking) */}
      <section className="nl-section" style={{ background: "#E3E8E2" }}>
        <div className="nl-wrap nl-stack" style={{ gap: 28, padding: 0 }}>
          <div className="nl-rv nl-stack" style={{ gap: 14, maxWidth: 680 }}>
            <span className="nl-eyebrow">From the blog</span>
            <h2 className="nl-h2" style={{ fontSize: "clamp(28px, 3.4vw, 40px)" }}>Free resume guides</h2>
          </div>
          <div className="nl-blog">
            {BLOG.map(([href, title]) => (
              <Link href={href} key={href}>
                {title}
                <span>Read the guide &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="nl-bg nl-dark">
        <BgImage
          src="/landing/skyline.jpg"
          position="center 62%"
          shade="linear-gradient(90deg, rgba(13,26,43,0.62) 0%, rgba(13,26,43,0.24) 60%, rgba(13,26,43,0.05) 100%)"
        />
        <div className="nl-wrap nl-bg-content">
          <div className="nl-cta-in">
            <div className="nl-cta-copy nl-rv">
              <h2 className="nl-h2" style={{ fontSize: "clamp(34px, 4.8vw, 60px)", lineHeight: 1.04 }}>
                Find out where your resume <em style={{ color: "#F2660A" }}>really stands.</em>
              </h2>
              <p className="nl-lead">Free, takes 30 seconds, and you&rsquo;ll know exactly what to fix before you apply.</p>
            </div>
            <button type="button" className="nl-btn nl-btn-or" style={{ padding: "18px 34px", fontSize: 18 }} onClick={onScan}>
              Scan my resume free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="nl-foot">
        <div className="nl-foot-in">
          <div className="nl-foot-row">
            <span className="nl-display" style={{ fontSize: 21, color: "#fff" }}>eCareer Design</span>
            <div className="nl-foot-links">
              <Link href="/blog">Blog</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:hello@ecareerdesign.net">Contact us</a>
            </div>
          </div>
          <div className="nl-foot-links">
            <a href="https://www.facebook.com/profile.php?id=61591358744526">Facebook</a>
            <a href="https://www.instagram.com/ecareerdesign/">Instagram</a>
            <a href="https://www.linkedin.com/in/ecareer-design-874062420/">LinkedIn</a>
            <a href="https://www.tiktok.com/@ecareerdesign.net">TikTok</a>
            <a href="https://www.youtube.com/@eCareerdesign">YouTube</a>
          </div>
          <span style={{ fontSize: 14 }}>eCareer Design AI Resume Studio · Resumes, STAR responses and interview prep for every kind of career.</span>
        </div>
      </footer>
    </div>
  );
}

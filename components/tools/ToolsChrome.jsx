"use client";
import { useEffect } from "react";
import Image from "next/image";
import { Fraunces, Inter } from "next/font/google";
import { TOOLS_CSS } from "./toolsStyles";

// Same families, weights and styles as app/layout.js, so Next reuses the font files that are
// already loaded. `variable` just exposes them to the scoped styles.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--nt-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--nt-body",
});

export const TOOLS_FONT_CLASS = `${display.variable} ${body.variable}`;

// Name, one line, and photo for each tool. `mode` is the wizard mode; null means the chooser.
const BANDS = {
  none: { eyebrow: "Your toolkit", title: "What do you want to build?", sub: "Pick a starting point. You can come back for the others.", img: "/landing/compass.jpg" },
  resume: { eyebrow: "Resume Builder", title: "A resume that sounds like you.", sub: "An ATS-friendly resume built from your real background.", img: "/landing/resumes.jpg" },
  application: { eyebrow: "Job Tailoring", title: "Matched to one posting.", sub: "Your resume and STAR responses, tailored to the job you want.", img: "/landing/compass.jpg" },
  coverletter: { eyebrow: "Cover Letter", title: "Written for this job.", sub: "A cover letter drawn from your background and the posting.", img: "/landing/stones.jpg" },
  interview: { eyebrow: "Interview Prep", title: "Walk in ready.", sub: "Practice likely questions and get a report on your answers.", img: "/landing/desk.jpg" },
  coach: { eyebrow: "Interview Coach", title: "Build your stories, then practice.", sub: "Turn your experience into STAR stories and rehearse them.", img: "/landing/skyline.jpg" },
};

// Presentation only. Navigation and sign-out are the same actions the rest of the app already uses.
export default function ToolsChrome({ mode, homeLabel, onHome, onLogout, showLogout }) {
  const band = BANDS[mode || "none"] || BANDS.none;
  // Opening a tool (or switching tool) starts at the top, so the band and bar are in view.
  useEffect(() => { window.scrollTo(0, 0); }, [mode]);
  const homeText = homeLabel.replace("← ", "");
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TOOLS_CSS }} />
      <header className="nt-nav">
        <div className="nt-nav-in">
          <button type="button" className="nt-brand" onClick={onHome} aria-label={`eCareer Design ${homeText.toLowerCase()}`}>
            <span className="nt-mark" aria-hidden="true">e</span>
            <span className="nt-brand-name">eCareer Design</span>
          </button>
          <nav className="nt-links" aria-label="Main">
            <button type="button" className="nt-link" onClick={onHome}>{homeText}</button>
            {showLogout && <button type="button" className="nt-link" onClick={onLogout}>Log out</button>}
          </nav>
        </div>
      </header>
      <section className="nt-band" aria-label={band.eyebrow}>
        <div className="nt-band-img" aria-hidden="true">
          <Image src={band.img} alt="" fill sizes="100vw" />
        </div>
        <div className="nt-band-shade" aria-hidden="true" />
        <div className="nt-band-in">
          <p className="nt-eyebrow">{band.eyebrow}</p>
          <h1>{band.title}</h1>
          <p className="nt-sub">{band.sub}</p>
        </div>
      </section>
    </>
  );
}

"use client";
import Image from "next/image";
import { Fraunces, Inter } from "next/font/google";
import { PUBLIC_CSS } from "./publicStyles";

// Same families, weights and styles as app/layout.js, so Next reuses the font files that are
// already loaded. `variable` just exposes them to the scoped styles.
const display = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap", variable: "--np-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--np-body" });

// A photo section with a dark shade for legible text. Decorative, so the image has empty alt.
export function PhotoBand({ src, shade, priority, className = "", children }) {
  return (
    <section className={`np-bg np-dark ${className}`}>
      <div className="np-bg-layer" aria-hidden="true">
        <Image
          src={src}
          alt=""
          width={src.includes("skyline") ? 1408 : 1376}
          height={768}
          sizes="100vw"
          priority={priority}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="np-shade" aria-hidden="true" style={{ background: shade }} />
      {children}
    </section>
  );
}

// Page frame for the redesigned public pages: sticky bar, content, footer.
export default function PublicShell({ children }) {
  return (
    <div className={`np ${display.variable} ${body.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: PUBLIC_CSS }} />
      <header className="np-nav">
        <div className="np-nav-in">
          <a href="/" className="np-brand" aria-label="eCareer Design home">
            <span className="np-mark" aria-hidden="true">e</span>
            <span className="np-brand-name">eCareer Design</span>
          </a>
          <nav className="np-links" aria-label="Main">
            <a className="np-link" href="/pricing">Pricing</a>
            <a className="np-link" href="/blog">Blog</a>
            <a className="np-btn np-btn-or np-navbtn" href="/" style={{ minHeight: 40 }}>Open eCareer Design</a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="np-foot">
        <a href="/blog">Blog</a>
        <a href="/pricing">Pricing</a>
        <a href="/jobscan-alternative">Jobscan Alternative</a>
        <a href="/teal-alternative">Teal Alternative</a>
        <a href="/privacy">Privacy Notice</a>
        <a href="/terms">Terms of Use</a>
        <a href="mailto:hello@ecareerdesign.net">Contact Us</a>
      </footer>
    </div>
  );
}

"use client";
import { useEffect } from "react";
import Image from "next/image";
import { Fraunces, Inter } from "next/font/google";

// Same families/weights as app/layout.js so Next reuses the files already loaded.
const display = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap", variable: "--na-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--na-body" });

const CSS = `
.na { --navy:#16283D; --deep:#0D1A2B; --orange:#F2660A; --orange-ink:#B34700; --paper:#EEF0EC; --line:#D7DBD6; --muted:#3C5069;
  min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); background: var(--paper); color: var(--navy);
  font-family: var(--na-body), system-ui, sans-serif; }
.na *, .na *::before, .na *::after { box-sizing: border-box; }
.na-side { position: relative; overflow: hidden; color: #fff; background: var(--deep); display: flex; flex-direction: column; justify-content: space-between; padding: 32px 48px 48px; min-height: 100vh; }
.na-side-img { position: absolute; inset: 0; }
.na-side-img img { object-fit: cover; }
.na-side-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(13,26,43,0.78) 0%, rgba(13,26,43,0.55) 45%, rgba(13,26,43,0.9) 100%); }
.na-brand, .na-pitch { position: relative; z-index: 1; }
.na-brand { display: inline-flex; align-items: center; gap: 10px; color: #fff; background: none; border: 0; padding: 0; cursor: pointer; font: inherit; }
.na-mark { width: 36px; height: 36px; border-radius: 10px; background: var(--orange); color: var(--deep); display: flex; align-items: center; justify-content: center; font-family: var(--na-display), Georgia, serif; font-weight: 600; font-size: 22px; }
.na-brand-name { font-family: var(--na-display), Georgia, serif; font-weight: 600; font-size: 21px; }
.na-pitch h2 { font-family: var(--na-display), Georgia, serif; font-weight: 600; font-size: clamp(30px, 3.6vw, 44px); line-height: 1.1; letter-spacing: -0.015em; margin: 0 0 14px; }
.na-pitch p.na-lede { color: #C9D2DD; font-size: 17px; max-width: 420px; margin: 0; line-height: 1.55; }
.na-pitch .na-eyebrow, .na-eyebrow { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--orange); margin: 0 0 10px; }
.na-main { display: flex; align-items: center; justify-content: center; padding: 48px 32px; }
.na-card { width: 100%; max-width: 420px; }
.na-card h1 { font-family: var(--na-display), Georgia, serif; font-weight: 600; font-size: 34px; letter-spacing: -0.015em; margin: 0 0 6px; }
.na-switch { font-size: 15px; color: var(--muted); margin: 0 0 24px; }
.na-switch button { background: none; border: 0; padding: 0; font: inherit; font-weight: 600; color: var(--orange-ink); text-decoration: underline; cursor: pointer; }
.na-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 46px; border-radius: 999px; font: inherit; font-weight: 600; font-size: 15px; padding: 10px 22px; cursor: pointer; border: 2px solid transparent; transition: background 0.15s, transform 0.15s; }
.na-btn-google { background: #fff; border-color: #B9C1BC; color: var(--navy); }
.na-btn-google:hover { background: var(--paper); }
.na-btn-go { background: var(--orange); color: var(--deep); border-color: var(--orange); }
.na-btn-go:hover:not(:disabled) { background: #FF7A24; }
.na-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.na-btn:focus-visible, .na-input:focus-visible, .na-brand:focus-visible, .na-switch button:focus-visible, .na-back:focus-visible { outline: 3px solid #FFB07A; outline-offset: 2px; }
.na-or { display: flex; align-items: center; gap: 12px; margin: 18px 0; color: var(--muted); font-size: 13px; }
.na-or::before, .na-or::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.na-label { display: block; font-size: 14px; font-weight: 600; margin: 0 0 6px; }
.na-field { margin-bottom: 16px; }
.na-input { width: 100%; min-height: 46px; padding: 10px 14px; font: inherit; font-size: 16px; color: var(--navy); background: #fff; border: 1px solid #B9C1BC; border-radius: 12px; }
.na-err { color: #B42318; font-size: 14px; margin: 0 0 14px; }
.na-back { display: inline-block; margin-top: 22px; font-size: 14px; color: var(--muted); background: none; border: 0; padding: 0; font-family: inherit; cursor: pointer; text-decoration: underline; }
.na-spin { animation: na-spin 1s linear infinite; }
@keyframes na-spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) {
  .na { grid-template-columns: 1fr; }
  .na-side { min-height: 0; padding: 20px 20px 28px; gap: 28px; }
  .na-pitch h2 { font-size: 28px; }
  .na-pitch p.na-lede { font-size: 15.5px; }
  .na-main { padding: 28px 20px 48px; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) { .na-btn { transition: none; } .na-spin { animation: none; } }
`;

const GOOGLE = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

// Presentation only. Sign-in, sign-up, Google and errors all stay in ECareerDesign.jsx and come in as props.
export default function NewAuthView({ mode, onToggleMode, email, setEmail, password, setPassword, error, loading, onSubmit, onGoogle, onHome }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const signup = mode === "signup";
  const canSubmit = !loading && !!email && !!password;
  return (
    <div className={`na ${display.variable} ${body.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <aside className="na-side">
        <div className="na-side-img" aria-hidden="true"><Image src="/landing/skyline.jpg" alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" /></div>
        <div className="na-side-shade" aria-hidden="true" />
        <button type="button" className="na-brand" onClick={onHome} aria-label="eCareer Design home">
          <span className="na-mark" aria-hidden="true">e</span>
          <span className="na-brand-name">eCareer Design</span>
        </button>
        <div className="na-pitch">
          <p className="na-eyebrow">{signup ? "Start free" : "Welcome back"}</p>
          <h2>Enter your background once. Apply everywhere.</h2>
          <p className="na-lede">Resumes, cover letters and interview prep built from what you have actually done.</p>
        </div>
      </aside>

      <main className="na-main">
        <div className="na-card">
          <h1>{signup ? "Create your account" : "Log in"}</h1>
          <p className="na-switch">
            {signup ? "Already have an account? " : "Don't have an account yet? "}
            <button type="button" onClick={onToggleMode}>{signup ? "Log in" : "Sign up"}</button>
          </p>

          <button type="button" className="na-btn na-btn-google" onClick={onGoogle}>{GOOGLE} Continue with Google</button>
          <div className="na-or" aria-hidden="true">or</div>

          <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(); }} noValidate>
            <div className="na-field">
              <label className="na-label" htmlFor="na-email">Email</label>
              <input id="na-email" className="na-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="na-field">
              <label className="na-label" htmlFor="na-password">Password</label>
              <input id="na-password" className="na-input" type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className="na-err" role="alert">{error}</p>}
            <button type="submit" className="na-btn na-btn-go" disabled={!canSubmit}>
              {loading ? "Please wait..." : signup ? "Sign up" : "Log in"}
            </button>
          </form>
          <button type="button" className="na-back" onClick={onHome}>Back to home</button>
        </div>
      </main>
    </div>
  );
}

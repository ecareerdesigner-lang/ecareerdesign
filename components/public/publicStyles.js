// Styles for the redesigned public pages, kept as a string and rendered in a <style> tag (same
// pattern as the landing page, dashboard and tools). Do not import a .css file here: the PostCSS
// config expects Tailwind 3 but the lockfile has Tailwind 4, so any CSS import breaks the build.
export const PUBLIC_CSS = `
.np {
  --np-navy: #16283D; --np-deep: #0D1A2B; --np-blue: #2F5D8F; --np-orange: #F2660A; --np-orange-ink: #B34700;
  --np-orange-soft: #FDE3CC; --np-paper: #EEF0EC; --np-line: #D7DBD6; --np-muted: #3C5069; --np-ondark: #C9D2DD;
  --np-green: #2F6F4E; --np-red: #B23A2E;
  font-family: var(--np-body), system-ui, sans-serif; color: var(--np-navy); background: var(--np-paper);
  font-size: 16px; line-height: 1.5; overflow-x: clip; width: 100%; min-height: 100vh;
}
.np *, .np *::before, .np *::after { box-sizing: border-box; }
.np h1, .np h2, .np h3 { font-family: var(--np-display), Georgia, serif; margin: 0; font-weight: 600; letter-spacing: -0.015em; }
.np p { margin: 0; }
.np button { font: inherit; }
.np-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.np-eyebrow { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--np-orange-ink); }
.np-dark .np-eyebrow { color: var(--np-orange); }

.np-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 24px;
  border-radius: 999px; font-weight: 600; font-size: 15px; text-decoration: none; cursor: pointer; border: 1px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s; }
.np-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.np-btn-or { background: var(--np-orange); color: var(--np-deep); }
.np-btn-or:hover:not(:disabled) { background: #FF7A24; }
.np-btn-navy { background: var(--np-navy); color: #fff; }
.np-btn-navy:hover:not(:disabled) { background: var(--np-deep); }
.np-btn-gh { background: #fff; color: var(--np-navy); border-color: #B9C1BC; }
.np-btn-gh:hover:not(:disabled) { background: var(--np-paper); }
.np a:focus-visible, .np button:focus-visible, .np-upload:focus-within { outline: 3px solid #FFB07A; outline-offset: 2px; }

/* Sticky top bar */
.np-nav { position: sticky; top: 0; z-index: 50; color: #fff; background: rgba(13,26,43,0.92);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.12); }
.np-nav-in { max-width: 1120px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.np-brand { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; }
.np-mark { width: 36px; height: 36px; border-radius: 10px; background: var(--np-orange); color: var(--np-deep); display: flex; align-items: center; justify-content: center; font-family: var(--np-display), Georgia, serif; font-weight: 600; font-size: 22px; }
.np-brand-name { font-family: var(--np-display), Georgia, serif; font-weight: 600; font-size: 21px; }
.np-links { display: flex; align-items: center; gap: 8px 26px; font-size: 15px; font-weight: 500; }
.np-link { color: #fff; text-decoration: none; padding: 4px 0; }
.np-link:hover { color: var(--np-orange); }

/* Photo band */
.np-bg { position: relative; overflow: hidden; background: var(--np-deep); color: #fff; }
.np-bg-layer { position: absolute; inset: 0; pointer-events: none; }
.np-bg-layer img { object-fit: cover; }
.np-shade { position: absolute; inset: 0; }
.np-hero { position: relative; padding-top: 64px; padding-bottom: 150px; }
.np-hero h1 { font-size: clamp(32px, 5vw, 54px); line-height: 1.08; margin: 10px 0 14px; max-width: 820px; }
.np-hero h1 em { font-style: italic; color: var(--np-orange); }
.np-hero .np-lead { font-size: 18px; color: var(--np-ondark); max-width: 640px; }
.np-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
.np-pill { font-size: 14px; font-weight: 500; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.28); background: rgba(255,255,255,0.08); }

/* Tool card overlaps the hero */
.np-tool { position: relative; margin-top: -110px; background: #fff; border-radius: 24px; padding: 32px; box-shadow: 0 30px 70px -28px rgba(13,26,43,0.55); border-top: 4px solid var(--np-orange); scroll-margin-top: 80px; }
.np-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; min-width: 0; }
.np-label { font-size: 14px; font-weight: 600; color: var(--np-navy); }
.np-field textarea, .np-email { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid #B9C1BC; font: inherit; font-size: 15px; color: var(--np-navy); background: #fff; }
.np-field textarea { min-height: 170px; resize: vertical; }
.np-field textarea:focus, .np-email:focus { outline: 3px solid #FFB07A; outline-offset: 1px; border-color: var(--np-orange); }
.np-upload { display: block; border: 2px dashed #B9C1BC; border-radius: 16px; padding: 26px 20px; text-align: center; background: var(--np-paper); cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.np-upload:hover { border-color: var(--np-orange); background: #fff; }
.np-upload.has-file { border-style: solid; border-color: var(--np-green); background: #F1F8F4; }
.np-upload strong { display: block; font-size: 16px; overflow-wrap: anywhere; }
.np-upload span { font-size: 13.5px; color: var(--np-muted); }
.np-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); border: 0; white-space: nowrap; }
.np-err { color: var(--np-red); font-size: 14px; margin-top: 12px; }

/* Result */
.np-score-row { display: flex; flex-wrap: wrap; align-items: center; gap: 20px 32px; padding-bottom: 22px; border-bottom: 1px solid var(--np-line); margin-bottom: 8px; }
.np-score { font-family: var(--np-display), Georgia, serif; font-size: 72px; line-height: 1; font-weight: 600; }
.np-score small { font-size: 26px; color: var(--np-muted); font-weight: 500; }
.np-bar-wrap { flex: 1 1 260px; min-width: 0; }
.np-bar { height: 12px; border-radius: 999px; background: var(--np-paper); border: 1px solid var(--np-line); overflow: hidden; }
.np-bar > span { display: block; height: 100%; background: var(--np-orange); border-radius: 999px; transition: width 0.5s ease; }
.np-h3 { font-size: 20px; margin: 26px 0 12px !important; }
.np-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.np-chip { font-size: 14px; font-weight: 500; padding: 5px 14px; border-radius: 999px; border: 1px solid var(--np-line); background: var(--np-paper); }
.np-chip.ok { color: var(--np-green); border-color: #B7D6C6; background: #EAF4EE; }
.np-chip.miss { color: var(--np-red); border-color: #E6BDB7; background: #FBEDEB; }
.np-chip.kw { color: var(--np-orange-ink); border-color: #F3C9A4; background: var(--np-orange-soft); }
.np-take { color: var(--np-muted); font-size: 16.5px; max-width: 720px; }
.np-gate { margin-top: 28px; background: var(--np-orange-soft); border: 1px solid #F3C9A4; border-radius: 18px; padding: 22px; text-align: center; }
.np-gate p { font-weight: 600; margin-bottom: 14px; }
.np-email-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.np-email { flex: 1 1 240px; max-width: 340px; }
.np-again { display: inline-block; margin-top: 20px; color: var(--np-orange-ink); font-weight: 600; background: none; border: 0; padding: 4px 0; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }

/* Sections */
.np-section { padding: 72px 0 0; }
.np-h2 { font-size: clamp(26px, 3.2vw, 38px); line-height: 1.1; margin: 6px 0 10px; }
.np-sub { color: var(--np-muted); max-width: 620px; }
.np-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 26px; }
.np-step { background: #fff; border: 1px solid var(--np-line); border-radius: 20px; padding: 24px; }
.np-step-n { width: 40px; height: 40px; border-radius: 12px; background: var(--np-orange-soft); color: var(--np-orange-ink); display: flex; align-items: center; justify-content: center; font-family: var(--np-display), Georgia, serif; font-weight: 600; font-size: 20px; margin-bottom: 14px; }
.np-step h3 { font-size: 19px; margin-bottom: 6px; }
.np-step p { font-size: 15px; color: var(--np-muted); }

/* Closing band */
.np-cta { margin-top: 80px; padding: 72px 0; }
.np-cta-in { position: relative; }
.np-cta h2 { font-size: clamp(28px, 3.8vw, 44px); line-height: 1.1; max-width: 700px; margin: 8px 0 22px; }

/* Footer */
.np-foot { padding: 28px 24px 40px; text-align: center; font-size: 13px; color: #5B665F; }
.np-foot a { color: #5B665F; margin: 0 8px; }
.np-foot a:hover { color: var(--np-orange-ink); }

@media (max-width: 760px) {
  .np-link { display: none; }
  .np-nav-in { padding: 10px 16px; }
  .np-brand-name { font-size: 18px; }
  .np-mark { width: 32px; height: 32px; font-size: 20px; }
  .np-btn.np-navbtn { padding: 8px 16px; font-size: 14px; }
}
@media (max-width: 640px) {
  .np-wrap { padding: 0 16px; }
  .np-hero { padding-top: 44px; padding-bottom: 130px; }
  .np-tool { padding: 22px 18px; }
  .np-score { font-size: 60px; }
}
@media (prefers-reduced-motion: reduce) { .np-bar > span, .np-upload { transition: none; } }
`;

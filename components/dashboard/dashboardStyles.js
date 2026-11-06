// Styles for the redesigned dashboard, kept as a string and rendered in a <style> tag
// (same pattern as the new homepage). Do not import a .css file here: the PostCSS config
// expects Tailwind 3 but the lockfile has Tailwind 4, so any CSS import breaks the build.
export const DASHBOARD_CSS = `
/* Everything is scoped under .nd so nothing leaks into other screens. */
.nd {
  --nd-navy: #16283D;
  --nd-deep: #0D1A2B;
  --nd-blue: #2F5D8F;
  --nd-orange: #F2660A;
  --nd-orange-ink: #B34700;
  --nd-orange-soft: #FDE3CC;
  --nd-paper: #EEF0EC;
  --nd-line: #D7DBD6;
  --nd-muted: #3C5069;
  --nd-ondark: #C9D2DD;
  --nd-green: #2F6F4E;
  --nd-red: #B23A2E;
  font-family: var(--nd-body), system-ui, sans-serif;
  color: var(--nd-navy);
  background: var(--nd-paper);
  font-size: 16px;
  line-height: 1.5;
  overflow-x: clip;
  width: 100%;
  min-height: 100vh;
}
.nd *, .nd *::before, .nd *::after { box-sizing: border-box; }
.nd h1, .nd h2, .nd h3 { font-family: var(--nd-display), Georgia, serif; margin: 0; font-weight: 600; letter-spacing: -0.015em; }
.nd p { margin: 0; }
.nd button { font: inherit; }
.nd-wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.nd-eyebrow { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nd-orange-ink); }
.nd-dark .nd-eyebrow { color: var(--nd-orange); }

/* Buttons */
.nd-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 10px 22px; border-radius: 999px;
  font-weight: 600; font-size: 15px; text-decoration: none; cursor: pointer;
  border: 1px solid transparent; transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.nd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.nd-btn-or { background: var(--nd-orange); color: var(--nd-deep); }
.nd-btn-or:hover:not(:disabled) { background: #FF7A24; }
.nd-btn-navy { background: var(--nd-navy); color: #fff; }
.nd-btn-navy:hover:not(:disabled) { background: var(--nd-deep); }
.nd-btn-gh { background: #fff; color: var(--nd-navy); border-color: #B9C1BC; }
.nd-btn-gh:hover:not(:disabled) { background: var(--nd-paper); }
.nd-btn:focus-visible, .nd-navlink:focus-visible, .nd-tool:focus-visible, .nd-stat-link:focus-visible, .nd-x:focus-visible {
  outline: 3px solid #FFB07A; outline-offset: 2px;
}

/* Sticky top bar */
.nd-nav {
  position: sticky; top: 0; z-index: 50; color: #fff;
  background: rgba(13,26,43,0.92);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.12);
}
.nd-nav-in { max-width: 1120px; margin: 0 auto; padding: 12px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.nd-brand { display: flex; align-items: center; gap: 10px; color: #fff; background: none; border: 0; padding: 0; cursor: pointer; }
.nd-mark { width: 36px; height: 36px; border-radius: 10px; background: var(--nd-orange); color: var(--nd-deep); display: flex; align-items: center; justify-content: center; font-family: var(--nd-display), Georgia, serif; font-weight: 600; font-size: 22px; }
.nd-brand-name { font-family: var(--nd-display), Georgia, serif; font-weight: 600; font-size: 21px; }
.nd-nav-links { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 24px; font-size: 15px; font-weight: 500; }
.nd-navlink { color: #fff; background: none; border: 0; padding: 4px 0; font-weight: 500; cursor: pointer; }
.nd-navlink:hover { color: var(--nd-orange); }

/* Hero band with photo */
.nd-bg { position: relative; overflow: hidden; background: var(--nd-deep); color: #fff; }
.nd-bg-layer { position: absolute; inset: 0; pointer-events: none; }
.nd-bg-layer img { object-fit: cover; }
.nd-shade { position: absolute; inset: 0; }
.nd-hero { position: relative; padding-top: 64px; padding-bottom: 120px; }
.nd-hero h1 { font-size: clamp(34px, 5vw, 56px); line-height: 1.08; margin: 10px 0 12px; }
.nd-hero h1 em { font-style: italic; color: var(--nd-orange); }
.nd-hero p.nd-lead { font-size: 18px; color: var(--nd-ondark); max-width: 560px; }

/* Stat cards overlap the hero */
.nd-stats { position: relative; margin-top: -76px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.nd-stat { background: #fff; border-radius: 20px; padding: 22px; box-shadow: 0 24px 50px -24px rgba(13,26,43,0.45); display: flex; flex-direction: column; gap: 10px; min-height: 176px; border-top: 4px solid var(--nd-orange); }
.nd-stat.blue { border-top-color: var(--nd-blue); }
.nd-stat-label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--nd-muted); }
.nd-stat-big { font-family: var(--nd-display), Georgia, serif; font-size: 40px; line-height: 1; font-weight: 600; }
.nd-stat-big small { font-size: 20px; color: var(--nd-muted); font-weight: 500; }
.nd-stat-note { font-size: 14.5px; color: var(--nd-muted); }
.nd-stat-actions { margin-top: auto; }
.nd-bar { height: 10px; border-radius: 999px; background: var(--nd-paper); overflow: hidden; border: 1px solid var(--nd-line); }
.nd-bar > span { display: block; height: 100%; background: var(--nd-orange); border-radius: 999px; transition: width 0.4s ease; }
.nd-bar.ok > span { background: var(--nd-green); }
.nd-skel { background: linear-gradient(90deg, #E6E9E4 25%, #F3F5F1 50%, #E6E9E4 75%); background-size: 200% 100%; animation: nd-shim 1.4s infinite; border-radius: 8px; }
@keyframes nd-shim { to { background-position: -200% 0; } }

/* Sections */
.nd-section { padding: 64px 0 0; }
.nd-h2 { font-size: clamp(26px, 3.2vw, 36px); line-height: 1.1; margin: 6px 0 8px; }
.nd-sub { color: var(--nd-muted); max-width: 620px; }

/* Matches panel */
.nd-panel { background: #fff; border: 1px solid var(--nd-line); border-radius: 20px; padding: 8px 22px; margin-top: 20px; }
.nd-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--nd-line); }
.nd-row:last-child { border-bottom: 0; }
.nd-row-main { min-width: 0; }
.nd-row-title { font-weight: 600; overflow-wrap: anywhere; }
.nd-row-meta { font-size: 14px; color: var(--nd-muted); overflow-wrap: anywhere; }
.nd-empty { padding: 18px 0; color: var(--nd-muted); }

/* Tool cards */
.nd-tools { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 22px; }
.nd-tool { display: flex; gap: 16px; align-items: flex-start; text-align: left; text-decoration: none; color: inherit; background: #fff; border: 1px solid var(--nd-line); border-radius: 20px; padding: 20px; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; width: 100%; }
@media (hover: hover) { .nd-tool:hover { transform: translateY(-3px); border-color: var(--nd-orange); box-shadow: 0 14px 30px -16px rgba(13,26,43,0.4); } }
.nd-ico { flex: none; width: 46px; height: 46px; border-radius: 14px; background: var(--nd-orange-soft); color: var(--nd-orange-ink); display: flex; align-items: center; justify-content: center; }
.nd-tool-t { display: block; font-family: var(--nd-display), Georgia, serif; font-weight: 600; font-size: 19px; line-height: 1.2; margin-bottom: 4px; }
.nd-tool-d { display: block; font-size: 14.5px; color: var(--nd-muted); }
.nd .cf-spin { animation: nd-spin 1s linear infinite; }
@keyframes nd-spin { to { transform: rotate(360deg); } }

/* Match score band */
.nd-match { margin-top: 64px; padding: 72px 0; }
.nd-match-grid { position: relative; display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start; }
.nd-match-copy { flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.nd-match-copy h2 { font-size: clamp(28px, 3.6vw, 42px); line-height: 1.1; }
.nd-match-copy p { color: var(--nd-ondark); }
.nd-form { flex: 1 1 440px; min-width: 0; background: #fff; color: var(--nd-navy); border-radius: 24px; padding: 24px; box-shadow: 0 30px 70px -20px rgba(0,0,0,0.55); display: flex; flex-direction: column; gap: 14px; }
.nd-fields { display: flex; flex-wrap: wrap; gap: 12px; }
.nd-field { flex: 1 1 180px; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.nd-field label { font-size: 13px; font-weight: 600; color: var(--nd-muted); }
.nd-field input, .nd-field textarea { width: 100%; padding: 11px 12px; border-radius: 12px; border: 1px solid #B9C1BC; font: inherit; font-size: 15px; color: var(--nd-navy); background: #fff; }
.nd-field input:focus, .nd-field textarea:focus { outline: 3px solid #FFB07A; outline-offset: 1px; border-color: var(--nd-orange); }
.nd-field textarea { resize: vertical; min-height: 120px; }
.nd-err { color: var(--nd-red); font-size: 14px; }
.nd-result { border-top: 1px solid var(--nd-line); padding-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.nd-score { font-family: var(--nd-display), Georgia, serif; font-size: 52px; line-height: 1; font-weight: 600; }
.nd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.nd-chip { font-size: 13.5px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--nd-line); background: var(--nd-paper); }
.nd-chip.ok { color: var(--nd-green); border-color: #B7D6C6; background: #EAF4EE; }
.nd-chip.miss { color: var(--nd-red); border-color: #E6BDB7; background: #FBEDEB; }
.nd-chip-h { font-size: 13px; font-weight: 600; margin-bottom: 6px; }

/* Recent projects */
.nd-proj-type { font-size: 12.5px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: var(--nd-orange-soft); color: var(--nd-orange-ink); white-space: nowrap; }
.nd-proj-date { font-size: 13px; color: var(--nd-muted); white-space: nowrap; }
.nd-x { flex: none; width: 32px; height: 32px; border-radius: 50%; border: 0; background: transparent; color: #6B766F; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.nd-x:hover { background: #F6DEDA; color: var(--nd-red); }
.nd-meta { display: flex; align-items: center; gap: 12px; flex: none; }

/* Footer */
.nd-foot { margin-top: 72px; padding: 28px 24px 40px; text-align: center; font-size: 13px; color: #5B665F; }
.nd-foot a { color: #5B665F; margin: 0 8px; }
.nd-foot a:hover { color: var(--nd-orange-ink); }

@media (max-width: 640px) {
  .nd-wrap, .nd-nav-in { padding-left: 16px; padding-right: 16px; }
  .nd-hero { padding-top: 44px; padding-bottom: 108px; }
  .nd-row { flex-wrap: wrap; }
  .nd-meta { width: 100%; justify-content: space-between; }
  .nd-form { padding: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .nd-skel, .nd .cf-spin { animation: none; }
  .nd-bar > span, .nd-tool { transition: none; }
}
`;

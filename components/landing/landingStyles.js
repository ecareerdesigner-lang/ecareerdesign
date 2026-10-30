// Styles for the redesigned homepage, kept as a string and rendered in a <style> tag
// (same pattern as ECareerDesign.jsx). Do not import a .css file here: the PostCSS config
// expects Tailwind 3 but the lockfile has Tailwind 4, so any CSS import breaks the build.
export const LANDING_CSS = `
/* New homepage styles. Everything is scoped under .nl so nothing leaks into other screens. */
.nl {
  --nl-navy: #16283D;
  --nl-deep: #0D1A2B;
  --nl-blue: #2F5D8F;
  --nl-orange: #F2660A;
  --nl-orange-ink: #B34700;
  --nl-paper: #EEF0EC;
  --nl-line: #D7DBD6;
  --nl-muted: #3C5069;
  --nl-ondark: #C9D2DD;
  font-family: var(--nl-body), system-ui, sans-serif;
  color: var(--nl-navy);
  background: var(--nl-paper);
  font-size: 17px;
  line-height: 1.55;
  overflow-x: clip;
  width: 100%;
}
.nl *, .nl *::before, .nl *::after { box-sizing: border-box; }
.nl h1, .nl h2, .nl h3, .nl .nl-display {
  font-family: var(--nl-display), Georgia, serif;
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.015em;
}
.nl p { margin: 0; }
.nl section[id], .nl div[id] { scroll-margin-top: 84px; }

.nl-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.nl-section { padding: 96px 24px; }
.nl-eyebrow { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nl-orange-ink); }
.nl-dark .nl-eyebrow { color: var(--nl-orange); }
.nl-h2 { font-size: clamp(32px, 4.2vw, 52px); line-height: 1.08; }
.nl-lead { font-size: 19px; color: var(--nl-muted); }
.nl-dark { color: #fff; }
.nl-dark .nl-lead, .nl-dark .nl-body { color: var(--nl-ondark); }
.nl-stack { display: flex; flex-direction: column; }

/* Buttons */
.nl-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 46px; padding: 12px 26px; border-radius: 999px;
  font: inherit; font-weight: 600; font-size: 16px; text-decoration: none;
  cursor: pointer; border: 1px solid transparent; transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.nl-btn-or { background: var(--nl-orange); color: var(--nl-deep); }
.nl-btn-or:hover { background: #FF7A24; }
.nl-btn-ol { background: transparent; color: #fff; border-color: rgba(255,255,255,0.55); }
.nl-btn-ol:hover { background: rgba(255,255,255,0.12); }
.nl-btn-navy { background: var(--nl-navy); color: #fff; }
.nl-btn-navy:hover { background: var(--nl-deep); }
.nl-btn-gh { background: #fff; color: var(--nl-navy); border-color: #B9C1BC; }
.nl-btn-gh:hover { background: var(--nl-paper); }
.nl-btn:focus-visible, .nl-navlink:focus-visible, .nl-faq-q:focus-visible { outline: 3px solid #FFB07A; outline-offset: 2px; }

/* Sticky nav */
.nl-nav {
  position: sticky; top: 0; z-index: 50; color: #fff;
  background: rgba(13,26,43,0.92);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.12);
}
.nl-nav-in { max-width: 1200px; margin: 0 auto; padding: 12px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.nl-brand { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; }
.nl-mark { width: 36px; height: 36px; border-radius: 10px; background: var(--nl-orange); color: var(--nl-deep); display: flex; align-items: center; justify-content: center; font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 22px; }
.nl-brand-name { font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 21px; }
.nl-nav-links { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 26px; font-size: 15px; font-weight: 500; }
.nl-navlink { color: #fff; text-decoration: none; background: none; border: 0; padding: 4px 0; font: inherit; font-weight: 500; cursor: pointer; }
.nl-navlink:hover { color: var(--nl-orange); }

/* Image backgrounds (parallax drift) */
.nl-bg { position: relative; overflow: hidden; background: var(--nl-deep); }
.nl-bg-layer { position: absolute; left: 0; right: 0; top: -80px; bottom: -80px; pointer-events: none; }
.nl-bg-layer img { object-fit: cover; }
.nl-shade { position: absolute; inset: 0; }
.nl-bg-content { position: relative; }

/* Hero */
.nl-hero-in { display: flex; flex-wrap: wrap; align-items: center; gap: 56px; padding: 88px 0 112px; }
.nl-hero-copy { flex: 1 1 480px; min-width: 0; display: flex; flex-direction: column; gap: 26px; }
.nl-pill { align-self: flex-start; background: rgba(242,102,10,0.16); color: #FFC9A3; border: 1px solid rgba(242,102,10,0.55); font-weight: 600; font-size: 14px; padding: 6px 14px; border-radius: 999px; }
.nl-h1 { font-size: clamp(40px, 5.6vw, 70px); line-height: 1.03; letter-spacing: -0.025em; }
.nl-h1 em { font-style: italic; color: var(--nl-orange); }
.nl-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.nl-fine { font-size: 14px; color: var(--nl-ondark); }

/* Sample report card */
.nl-card-wrap { flex: 1 1 420px; min-width: 0; }
.nl-report { background: #fff; color: var(--nl-navy); border-radius: 24px; padding: 28px; box-shadow: 0 30px 70px -20px rgba(0,0,0,0.55); display: flex; flex-direction: column; gap: 22px; }
.nl-report-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.nl-tag { font-size: 12px; font-weight: 600; color: var(--nl-muted); border: 1px solid var(--nl-line); border-radius: 999px; padding: 3px 10px; }
.nl-bignum { font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 76px; line-height: 0.9; letter-spacing: -0.04em; color: var(--nl-blue); }
.nl-bar-row { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.nl-bar-row span:first-child { width: 86px; font-weight: 500; }
.nl-bar-row b { width: 28px; text-align: right; }
.nl-bar { flex: 1; height: 10px; background: #E3E8E2; border-radius: 99px; overflow: hidden; }
.nl-bar i { display: block; height: 100%; }
.nl-flag { border-radius: 12px; padding: 12px 14px; font-size: 15px; }

/* Ticker */
.nl-ticker { background: var(--nl-orange); color: var(--nl-deep); overflow: hidden; border-top: 1px solid var(--nl-deep); border-bottom: 1px solid var(--nl-deep); }
.nl-ticker-track { display: flex; width: max-content; padding: 16px 0; font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 20px; white-space: nowrap; animation: nl-mq 50s linear infinite; }
.nl-ticker-group { display: flex; align-items: center; gap: 36px; padding-right: 36px; }
.nl-ticker-item { display: flex; align-items: center; gap: 36px; }
.nl-diamond { width: 9px; height: 9px; background: var(--nl-deep); transform: rotate(45deg); display: block; }
@keyframes nl-mq { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Cards and grids */
.nl-grid { display: flex; flex-wrap: wrap; gap: 20px; }
.nl-grid > * { flex: 1 1 250px; min-width: 0; }
.nl-aud { background: #fff; border: 1px solid var(--nl-line); border-top: 5px solid var(--nl-blue); border-radius: 20px; padding: 28px; display: flex; flex-direction: column; gap: 12px; }
.nl-aud.or { border-top-color: var(--nl-orange); }
.nl-aud.dk { background: var(--nl-navy); color: #fff; border-color: rgba(255,255,255,0.22); border-top-color: var(--nl-orange); }
.nl-aud .k { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--nl-blue); }
.nl-aud.or .k { color: var(--nl-orange-ink); }
.nl-aud.dk .k { color: var(--nl-orange); }
.nl-aud h3 { font-size: 23px; line-height: 1.2; }
.nl-aud p { font-size: 16px; color: var(--nl-muted); }
.nl-aud.dk p { color: var(--nl-ondark); }

/* Before / after */
.nl-ba { display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch; }
.nl-ba > div { flex: 1 1 380px; min-width: 0; border-radius: 24px; padding: 34px; display: flex; flex-direction: column; gap: 18px; }
.nl-ba .bf { background: #fff; border: 1px solid var(--nl-line); }
.nl-ba .af { background: var(--nl-navy); color: #fff; box-shadow: 0 30px 60px -30px rgba(13,26,43,0.6); }
.nl-ba .row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.nl-ba .pct { font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 44px; }
.nl-ba .bf .pct { color: var(--nl-orange-ink); }
.nl-ba .af .pct { color: var(--nl-orange); }
.nl-ba blockquote { margin: 0; font-size: 20px; line-height: 1.45; }
.nl-ba .bf blockquote { color: var(--nl-muted); }
.nl-ba .af b { color: var(--nl-orange); }

/* Toolkit */
.nl-tools { display: flex; flex-wrap: wrap; gap: 56px; align-items: flex-start; }
.nl-tools-side { flex: 1 1 320px; min-width: 0; position: sticky; top: 108px; display: flex; flex-direction: column; gap: 18px; }
.nl-tools-list { flex: 1 1 480px; min-width: 0; display: flex; flex-direction: column; gap: 28px; }
.nl-tool { background: #fff; border: 1px solid var(--nl-line); border-radius: 24px; overflow: hidden; }
.nl-tool.dk { background: var(--nl-navy); color: #fff; border-color: var(--nl-navy); }
.nl-tool svg { display: block; width: 100%; height: 220px; }
.nl-tool-body { padding: 26px 28px 30px; display: flex; flex-direction: column; gap: 10px; }
.nl-tool-body h3 { font-size: 26px; }
.nl-tool-body p { color: var(--nl-muted); }
.nl-tool.dk .nl-tool-body p { color: var(--nl-ondark); }
.nl-badge { align-self: flex-start; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: #E3ECF5; color: #1F4268; }
.nl-badge.pr { background: var(--nl-orange); color: var(--nl-deep); }

.nl-tool-link { align-self: flex-start; background: none; border: 0; padding: 10px 0 0; font: inherit; font-weight: 600; color: var(--nl-blue); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.nl-tool-link:hover { color: var(--nl-navy); }
.nl-tool.dk .nl-tool-link { color: var(--nl-orange); }
.nl-tool.dk .nl-tool-link:hover { color: #FFB07A; }
.nl-tool-link:focus-visible { outline: 3px solid #FFB07A; outline-offset: 2px; }

/* Steps */
.nl-steps { display: flex; flex-wrap: wrap; gap: 24px; }
.nl-step { flex: 1 1 280px; min-width: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; padding: 32px; display: flex; flex-direction: column; gap: 12px; }
.nl-step .n { font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 56px; line-height: 1; color: var(--nl-orange); }
.nl-step h3 { font-size: 25px; }
.nl-step p { color: var(--nl-ondark); }

/* Pricing */
.nl-plans { display: flex; flex-wrap: wrap; gap: 20px; align-items: stretch; }
.nl-plan { flex: 1 1 300px; min-width: 0; background: #fff; border: 1px solid var(--nl-line); border-radius: 24px; padding: 32px; display: flex; flex-direction: column; gap: 20px; }
.nl-plan.feat { background: var(--nl-navy); color: #fff; border: 0; border-top: 5px solid var(--nl-orange); box-shadow: 0 30px 60px -30px rgba(13,26,43,0.7); }
.nl-plan .name { font-weight: 600; color: var(--nl-muted); }
.nl-plan.feat .name { color: var(--nl-orange); }
.nl-plan .price { font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 46px; line-height: 1.1; }
.nl-plan .price small { font-family: var(--nl-body), system-ui, sans-serif; font-size: 18px; font-weight: 500; color: var(--nl-muted); }
.nl-plan.feat .price small, .nl-plan.feat .sub { color: var(--nl-ondark); }
.nl-plan .sub { color: var(--nl-muted); font-size: 15px; }
.nl-plan .nl-btn { margin-top: auto; }
.nl-chk { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 16px; }
.nl-chk li { position: relative; padding-left: 26px; line-height: 1.45; }
.nl-chk li::before { content: ""; position: absolute; left: 5px; top: 5px; width: 6px; height: 11px; border: solid var(--nl-blue); border-width: 0 2px 2px 0; transform: rotate(40deg); }
.nl-plan.feat .nl-chk li::before { border-color: var(--nl-orange); }

/* FAQ */
.nl-faq { border-top: 1px solid var(--nl-line); }
.nl-faq-item { border-bottom: 1px solid var(--nl-line); }
.nl-faq-q { width: 100%; min-height: 64px; background: transparent; border: 0; padding: 18px 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; text-align: left; cursor: pointer; font-family: var(--nl-display), Georgia, serif; font-weight: 600; font-size: 21px; color: var(--nl-navy); }
.nl-faq-q .ic { flex: none; width: 32px; height: 32px; border-radius: 99px; background: var(--nl-orange); color: var(--nl-deep); display: flex; align-items: center; justify-content: center; font-size: 20px; line-height: 1; font-family: var(--nl-body), system-ui, sans-serif; }
.nl-faq-a { margin: 0 0 22px; color: var(--nl-muted); max-width: 720px; }

/* Blog */
.nl-blog { display: flex; flex-wrap: wrap; gap: 16px; }
.nl-blog a { flex: 1 1 300px; min-width: 0; background: #fff; border: 1px solid var(--nl-line); border-radius: 16px; padding: 22px 24px; color: var(--nl-navy); text-decoration: none; font-weight: 500; line-height: 1.4; transition: border-color 0.15s, transform 0.15s; }
.nl-blog a:hover { border-color: var(--nl-orange); transform: translateY(-2px); }
.nl-blog a span { display: block; margin-top: 10px; font-size: 14px; color: var(--nl-orange-ink); font-weight: 600; }

/* CTA + footer */
.nl-cta-in { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 32px; padding: 100px 0; }
.nl-cta-copy { flex: 1 1 460px; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.nl-foot { background: var(--nl-deep); color: var(--nl-ondark); }
.nl-foot-in { max-width: 1200px; margin: 0 auto; padding: 44px 24px; display: flex; flex-direction: column; gap: 22px; font-size: 15px; }
.nl-foot-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
.nl-foot-links { display: flex; flex-wrap: wrap; gap: 8px 24px; }
.nl-foot a { color: var(--nl-ondark); text-decoration: none; }
.nl-foot a:hover { color: #fff; }

/* Scroll motion (progressive: browsers without scroll-driven animations just show the page) */
@keyframes nl-rise { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
@keyframes nl-drift { from { transform: translateY(-70px); } to { transform: translateY(70px); } }
@supports (animation-timeline: view()) {
  .nl-rv { animation: nl-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 60%; }
  .nl-px { animation: nl-drift linear both; animation-timeline: view(); animation-range: cover; }
}
@media (prefers-reduced-motion: reduce) {
  .nl-ticker-track { animation: none; }
  .nl-rv, .nl-px { animation: none !important; }
  .nl-blog a { transition: none; }
}
@media (max-width: 860px) { .nl-tools-side { position: static; } }
@media (max-width: 760px) { .nl-navhide { display: none !important; } .nl-section { padding: 72px 20px; } .nl-wrap { padding: 0 20px; } }
`;

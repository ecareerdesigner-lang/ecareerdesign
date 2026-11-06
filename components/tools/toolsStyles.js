// Styles for the redesigned tool screens, kept as a string and rendered in a <style> tag
// (same pattern as the new homepage and dashboard). Do not import a .css file here: the PostCSS
// config expects Tailwind 3 but the lockfile has Tailwind 4, so any CSS import breaks the build.
//
// Two parts: the chrome (sticky bar + photo band) uses .nt-* classes, and the "skin" restyles the
// existing cards, buttons, inputs and stepper. The skin only applies inside .nt, which is only
// rendered when the new look is on, so the old screens are not affected.
export const TOOLS_CSS = `
.nt {
  --nt-navy: #16283D; --nt-deep: #0D1A2B; --nt-orange: #F2660A; --nt-orange-ink: #B34700;
  --nt-paper: #EEF0EC; --nt-line: #D7DBD6; --nt-ondark: #C9D2DD;
  background: var(--nt-paper); min-height: 100vh; width: 100%; overflow-x: clip;
}
.nt *, .nt *::before, .nt *::after { box-sizing: border-box; }

/* Sticky top bar */
.nt-nav { position: sticky; top: 0; z-index: 50; color: #fff; background: rgba(13,26,43,0.92);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.12); }
.nt-nav-in { max-width: 1120px; margin: 0 auto; padding: 12px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.nt-brand { display: flex; align-items: center; gap: 10px; color: #fff; background: none; border: 0; padding: 0; cursor: pointer; }
.nt-mark { width: 36px; height: 36px; border-radius: 10px; background: var(--nt-orange); color: var(--nt-deep); display: flex; align-items: center; justify-content: center; font-family: var(--nt-display), Georgia, serif; font-weight: 600; font-size: 22px; }
.nt-brand-name { font-family: var(--nt-display), Georgia, serif; font-weight: 600; font-size: 21px; }
.nt-links { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 24px; font-size: 15px; font-weight: 500; font-family: var(--nt-body), system-ui, sans-serif; }
.nt-link { color: #fff; background: none; border: 0; padding: 4px 0; font: inherit; font-weight: 500; cursor: pointer; }
.nt-link:hover { color: var(--nt-orange); }
.nt-link:focus-visible, .nt-brand:focus-visible { outline: 3px solid #FFB07A; outline-offset: 2px; }

/* Photo band with the tool's name */
.nt-band { position: relative; overflow: hidden; background: var(--nt-deep); color: #fff; }
.nt-band-img { position: absolute; inset: 0; pointer-events: none; }
.nt-band-img img { object-fit: cover; }
.nt-band-shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(13,26,43,0.92) 0%, rgba(13,26,43,0.72) 60%, rgba(13,26,43,0.5) 100%); }
.nt-band-in { position: relative; max-width: 1120px; margin: 0 auto; padding: 40px 24px 44px; font-family: var(--nt-body), system-ui, sans-serif; }
.nt-eyebrow { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--nt-orange); margin: 0; }
.nt-band h1 { font-family: var(--nt-display), Georgia, serif; font-weight: 600; letter-spacing: -0.015em; font-size: clamp(30px, 4.4vw, 46px); line-height: 1.08; margin: 8px 0 8px; }
.nt-band p.nt-sub { font-size: 17px; color: var(--nt-ondark); max-width: 560px; margin: 0; }

/* Skin: the old wizard heading is replaced by the band above */
.nt .cf-wizard-head { display: none; }

.nt .cf-card {
  border-radius: 20px !important;
  box-shadow: 0 1px 2px rgba(13,26,43,0.05), 0 14px 32px -20px rgba(13,26,43,0.35) !important;
}
.nt .cf-btn-primary, .nt .cf-btn-secondary, .nt .cf-btn-ink {
  border-radius: 999px !important; min-height: 44px; padding: 10px 22px !important; font-weight: 600 !important; justify-content: center;
}
.nt .cf-btn-primary { background: var(--nt-orange) !important; color: var(--nt-deep) !important; border-color: var(--nt-orange) !important; }
.nt .cf-btn-primary:hover { background: #FF7A24 !important; }
.nt .cf-btn-ink { background: var(--nt-navy) !important; border-color: var(--nt-navy) !important; color: #fff !important; }
.nt .cf-btn-ink:hover { background: var(--nt-deep) !important; }
.nt .cf-btn-secondary { border-color: #B9C1BC !important; }
.nt .cf-btn-secondary:hover { background: var(--nt-paper) !important; }
.nt .cf-btn:focus-visible { outline: 3px solid #FFB07A; outline-offset: 2px; }

.nt input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="range"]),
.nt textarea, .nt select {
  border-radius: 12px !important; border-color: #B9C1BC !important; background: #fff !important;
}
.nt input:focus-visible, .nt textarea:focus-visible, .nt select:focus-visible { outline: 3px solid #FFB07A; outline-offset: 1px; }

.nt .cf-seg-on { background: var(--nt-orange) !important; }
.nt .cf-choice { border-radius: 16px !important; background: #fff !important; transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }
@media (hover: hover) { .nt .cf-choice:hover { transform: translateY(-3px); border-color: var(--nt-orange) !important; box-shadow: 0 14px 30px -16px rgba(13,26,43,0.4); } }

@media (max-width: 640px) {
  .nt-nav-in, .nt-band-in { padding-left: 16px; padding-right: 16px; }
  .nt-band-in { padding-top: 28px; padding-bottom: 32px; }
}
@media (prefers-reduced-motion: reduce) { .nt .cf-choice { transition: none; } }
`;

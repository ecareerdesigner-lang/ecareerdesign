# eCareer Design Apply Assistant (Chrome extension, Manifest V3)

A Premium feature. It reads the saved resume in a customer's eCareer Design account, ranks roles that fit (USAJOBS, Adzuna, Jooble),
writes a tailored resume and cover letter for each, scores the match, fills in the application, and submits **only after the customer
approves on the page**.

## How it fits together

```
Chrome extension (this folder)  --bearer token-->  /api/extension/*  (Next.js routes in the main app)
  side panel (find, prepare, history)                 premium check  ->  usage limits  ->  Claude / job APIs  ->  Supabase
  content script (fills forms, review banner)
```

Server code lives in the main app: `app/api/extension/**`, `lib/extension/**`, `components/ExtensionConnect.jsx`,
and `supabase/migrations/20261106_extension_v2.sql`.

## What customers see

1. In the app Dashboard, **Apply Assistant** shows a pairing code. They paste it into the extension side panel once.
2. **Find roles that fit me** returns ranked matches with a plain reason each and a tag for how well the form can be filled.
3. **Prepare application** gives a match score, strengths, gaps, an editable cover letter, and a downloadable resume PDF.
4. **Open & fill application** fills the form and shows a review banner. Nothing is sent until they tick "I reviewed every field" and click Approve.
5. **History** lists everything prepared, dismissed, or approved.

## Guardrails (by design)

- Never submits without the on-page approval click, one application at a time. It logs "You approved", not "submitted", because it cannot confirm the site accepted it.
- Never answers legal, demographic, or attestation questions (work authorization, sponsorship, EEO, salary, consent and terms). They are listed as "Needs your answer".
- Never ticks required checkboxes, creates accounts, types passwords, or solves CAPTCHAs.
- Never overwrites a field that already has a value.
- Prompts forbid inventing experience; gaps are reported, not hidden.
- LinkedIn Easy Apply and Indeed Apply are not automated (their terms prohibit it). USAJOBS is "apply yourself": download the resume and use the cover letter.
- The server never makes requests to job links (that looks like bot traffic and can get your address blocked). Links are labelled by domain only.

## Server protections

- **Premium gate on every route**, using the same rule as the rest of the app (`hasPremium`: subscriber, or 30-day pass still running).
- **Daily limits** to control AI cost: 20 searches and 40 prepared applications per person per day (change with `EXT_MATCHES_PER_DAY`, `EXT_PREPARES_PER_DAY`). Rejected requests do not use up the allowance.
- **Connections** expire after 90 days, can be revoked by the customer (Dashboard card) or by the extension's Disconnect button, and at most 5 stay active per person.
- Pairing codes: 10 characters from an unambiguous alphabet, single-use, 10 minutes, at most 5 unused at a time.
- Tokens are stored only as SHA-256 hashes. The full resume text is never sent to the extension, only the contact fields it needs to fill forms.
- AI or database failures return a generic message to the customer; the detail goes to your logs (`error_logs`).
- Input is validated and size-capped; the resume PDF and application history are only readable by their owner.

## Set up the server (once)

1. Run `supabase/migrations/20261106_extension_v2.sql` in the Supabase SQL editor (after the original `supabase-extension.sql` tables exist). It is safe to run twice.
2. Environment variables (local `.env.local` and Vercel). Most already exist:
   `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`,
   `USAJOBS_API_KEY`, `USAJOBS_EMAIL`, `JOOBLE_API_KEY`.
   Optional: `EXT_MATCHES_PER_DAY`, `EXT_PREPARES_PER_DAY`, `EXT_CLAUDE_MODEL`.
3. When the extension is in the Chrome Web Store, set `NEXT_PUBLIC_EXTENSION_URL` to its link. That turns on the **Add to Chrome** link in the Dashboard card and the Apply Assistant line on the pricing page and Premium card. Until it is set, those marketing lines stay hidden.

## Try it locally

1. `npm run dev` in the main app. In `chrome://extensions`, turn on Developer mode, **Load unpacked**, and choose this folder (`ecareer-extension`).
   The source points at `http://localhost:3000`; a **DEV** badge shows in the panel while it does.
2. Sign in as a premium account, open the Dashboard, click **Get a pairing code**, and paste it into the side panel.
3. Reload the extension on `chrome://extensions` after changing any file here.

## Release to the Chrome Web Store

1. Bump `version` in `manifest.json`.
2. `node build.mjs`, then zip the `dist` folder contents (PowerShell: `Compress-Archive -Path dist\* -DestinationPath ecareer-apply-assistant.zip`). The build points at production and removes the localhost permission.
3. Upload the zip in the Chrome Web Store developer dashboard. Add screenshots (1280x800) and a 440x280 promo tile.
4. Update your Privacy page (see below) before submitting.

### Permission justifications (paste into the store form)

- **storage**: remembers the connection token and the last search results on this device.
- **sidePanel**: the extension's interface.
- **activeTab / scripting**: reads the job posting only when the customer clicks Score this page, and fills the application form only when the customer clicks Open & fill.
- **tabs**: opens job postings and returns to the tab being filled.
- **host permission eCareer Design**: talks to the customer's own account.
- **optional host access (https://*/*)**: requested per site, at the moment the customer asks to read or fill that site. It is never granted in advance.

### Privacy disclosures (add to /privacy)

- The extension sends to eCareer Design: the job posting text (only when the customer clicks), the job title, company, and link.
- The customer's saved resume is read on our servers and sent to our AI provider (Anthropic) to rank jobs and write documents.
- Contact details (name, email, phone, address, LinkedIn) are passed to the extension only to fill forms the customer opens.
- We do not collect browsing history, and we do not read pages the customer has not asked us to read.
- Connections can be revoked at any time from the Dashboard.

## QA checklist before each release

- [ ] Free account: Dashboard card absent; a copied token returns the upgrade screen, not data.
- [ ] 30-day pass account and subscriber account both work; an expired pass is blocked.
- [ ] Pair, disconnect from the panel, and confirm the old token stops working.
- [ ] Greenhouse, Lever, and Ashby test forms: fields fill, resume attaches, nothing is sent until Approve.
- [ ] A form with a CAPTCHA and one with required legal questions: both show in the banner and stay unanswered.
- [ ] USAJOBS and LinkedIn results show the "apply yourself" tag and hide Open & fill.
- [ ] Hit the daily limit and confirm the message and counter.
- [ ] Offline: the panel shows the retry state, not a blank screen.

## Known limits

- Form filling is tuned for Greenhouse, Lever, Ashby, and Workday (visible step only). Other sites use best-effort label matching.
- Dropdowns and custom widgets are left for the customer.
- Job descriptions from Adzuna and Jooble are short, so list scores are rough. **Score this page** on the full posting is more accurate.
- The resume PDF is deliberately plain and single-column for ATS parsing. Federal resumes need extra fields (hours per week, supervisor, salary and grade); a federal mode is a good next feature.

## Adding a new site

Add an adapter to `content/adapters.js` (job text, form, submit button), add its address to `content_scripts.matches` in `manifest.json`,
and add its domain to `lib/sites.js` and `lib/extension/siteSupport.js` so it shows the right tag.

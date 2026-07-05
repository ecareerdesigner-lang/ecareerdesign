# eCareer Design

STAR-format response and resume builder for your next job application.

## What works out of the box
- Job title entry, sample requirement library, and paste-a-posting extraction (AI-powered)
- Background profile intake, saved in the browser (localStorage)
- STAR response generation and regeneration per requirement, defensively capped at your character budget
- Special Skills & Associations summary generation
- Copy-to-clipboard and plain-text export
- Free to use — no paywall. See "Monetization" below for how to add ads or other revenue without gating access.

## What is stubbed and needs real integration before production use
- **Accounts**: there is no login. Background profiles are saved per-browser, not per-user.
- **Requirement library**: only 3 sample job titles are hardcoded in `components/ECareerDesign.jsx`. A real deployment should move this to a database with an admin-editable interface (see Option B in the original build spec).
- **.docx export**: this version exports plain text. Generating a real Word file requires a small server route using the `docx` npm package.

## Local setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in real values:
   ```
   cp .env.example .env.local
   ```
3. Run it:
   ```
   npm run dev
   ```
4. Open http://localhost:3000

## Monetization

There's no paywall in this version — generation is free and unlimited. A few ways to monetize without gating access:

- **Display ads**: Google AdSense is the simplest to start with, but requires an approved application (original content, some traffic history) and a privacy/cookie-consent notice since it sets tracking cookies. Carbon Ads is a more tasteful, lower-volume option common on professional/developer tools. Both are added via a script tag plus ad unit `<div>`s placed around the main content — ask if you want these actually wired into specific spots in the layout.
- **Affiliate/referral links**: resume review services, LinkedIn Premium, federal-focused career coaching, or interview prep tools relevant to this audience. Usually a specific tracked link, no ad network needed.
- **Sponsorship**: a single sponsor (career coaching firm, training provider) instead of a rotating ad network — simpler to implement (a static banner or "Sponsored by" line) and often better fit for a niche professional audience than programmatic ads.
- **Freemium**: keep the core flow free, charge for extras — real .docx export, saved multi-device profiles once accounts exist, or a higher per-requirement generation limit. This re-uses the Stripe integration pattern from an earlier version if you want to bring it back for just a subset of features.
- **Tip jar**: a simple "Buy Me a Coffee" / Ko-fi link costs nothing to add and avoids ad-network approval and privacy overhead entirely.

Whatever you choose, note that this app now collects real background/work-history data through a normal web form — if you add any third-party script (ad network, analytics), you should also add a basic privacy notice describing what's collected and shared, since that's both good practice and often a legal requirement (CCPA/GDPR) once third-party trackers are involved.

## Email capture

On every Export/Report screen, a "Email me a copy" card lets the person get their resume, cover letter, application responses, or interview report sent to their inbox — real, immediate value in exchange for an email address, rather than a cold newsletter signup. There's also an optional checkbox to opt into occasional product updates, which adds them to a Resend Audience (a simple mailing list) if configured.

Setup, via [Resend](https://resend.com) (free tier: 100 emails/day, 1,000 contacts):

1. Create a free account at https://resend.com
2. **Verify a sending domain** (or use their default `onboarding@resend.dev` for testing — real production sending needs your own verified domain, e.g. `ecareerdesign.net`, added under **Domains** in the Resend dashboard, with the DNS records they give you added at your registrar, same pattern as the Vercel domain setup)
3. Go to **API Keys** and create one. Set `RESEND_API_KEY`.
4. Set `RESEND_FROM_EMAIL` to an address at your verified domain, e.g. `"eCareer Design <hello@ecareerdesign.net>"`
5. **Optional** — for the mailing-list opt-in: go to **Audiences**, create one, copy its ID, and set `RESEND_AUDIENCE_ID`. Without this, the checkbox still shows but silently does nothing beyond sending the requested copy — no error, just no list growth.

Without any of these configured, the whole feature shows a clear "email delivery isn't configured yet" message rather than failing silently.

## Job search (resume mode)

After a resume is generated, a "Find matching jobs" panel searches real, live postings and links out to the original listing for the person to apply directly — the app never submits an application on their behalf, only links to it.

Three sources return real inline results, all optional (each is skipped with a warning shown in the UI if not configured):

- **USAJOBS** (federal positions) — free, but requires a quick approval step:
  1. Register at https://developer.usajobs.gov/apirequest/
  2. You'll get an API key tied to the email you registered with.
  3. Set `USAJOBS_API_KEY` and `USAJOBS_EMAIL` (the same email you registered with — their API requires it as the `User-Agent` header).

- **Adzuna** (broader private-sector postings) — free tier, faster signup:
  1. Register at https://developer.adzuna.com/
  2. You'll get an `app_id` and `app_key` immediately.
  3. Set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.

- **Jooble** (broad general-purpose aggregator, good coverage for local/non-tech roles) — free:
  1. Fill out the form at https://jooble.org/api/about
  2. You'll receive an API key by email.
  3. Set `JOOBLE_API_KEY`.

Add whichever keys you get to `.env.local` locally and to Vercel's Environment Variables for production, then redeploy. The search endpoint (`app/api/job-search/route.js`) merges and normalizes results from whichever sources are configured.

Separately, a row of "search directly on" buttons (Indeed, LinkedIn, ZipRecruiter, Monster, SimplyHired, Glassdoor, Ladders) link out to those sites' own search pages, pre-filled with the same title/location. These are plain links, not inline results — none of those seven currently offer a public search API (Indeed's was deprecated years ago; the others never had one), so pulling structured listings from them would require scraping, which isn't implemented here since it violates those sites' terms of service and breaks easily. Two other no-key job APIs exist (The Muse, Arbeitnow) but were left out deliberately — The Muse only filters by a fixed list of tech/corporate categories with no free-text search, and Arbeitnow's listings skew almost entirely Europe/remote-tech, so neither returns good results for a typical general or local search.

## PDF export (resume mode)

The "Download PDF" button captures the actual rendered template (whichever one and color you picked) using `html2canvas`, then assembles it into a real PDF with `jspdf` — so the download matches on-screen exactly, including multi-page splitting if the resume runs long. No server round-trip; this happens entirely in the browser.

## Adding a database and accounts

The build spec calls for Postgres via Supabase. Rough path:
1. Create a Supabase project, add the `User`, `Application`, `Requirement`, `BackgroundProfile`, and `SkillsSummary` tables from the build spec's data model.
2. Add Supabase Auth (email/password or SSO) for sign-in.
3. Replace the `localStorage` calls in `components/ECareerDesign.jsx` with calls to Supabase, scoped to the signed-in user.

# KSA Assist

STAR-format response builder for Federal Government Career applications.

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

## Adding a database and accounts

The build spec calls for Postgres via Supabase. Rough path:
1. Create a Supabase project, add the `User`, `Application`, `Requirement`, `BackgroundProfile`, and `SkillsSummary` tables from the build spec's data model.
2. Add Supabase Auth (email/password or SSO) for sign-in.
3. Replace the `localStorage` calls in `components/ECareerDesign.jsx` with calls to Supabase, scoped to the signed-in user.

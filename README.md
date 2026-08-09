# eCareerDesign

STAR-format response builder for internal USPS eCareer applications.

## What works out of the box
- Job title entry, sample requirement library, and paste-a-posting extraction (AI-powered)
- Background profile intake, saved in the browser (localStorage)
- STAR response generation and regeneration per requirement, with a 6,000-character budget
- Special Skills & Associations summary generation
- Copy-to-clipboard and plain-text export

## What is stubbed and needs real integration before production use
- **Payment**: the $25 gate is a simulated delay, not a real charge. See "Adding Stripe" below.
- **Accounts**: there is no login. Background profiles are saved per-browser, not per-user.
- **Requirement library**: only 3 sample job titles are hardcoded in `components/ECareerDesign.jsx`. A real deployment should move this to a database with an admin-editable interface (see Option B in the original build spec).
- **.docx export**: this version exports plain text. Generating a real Word file requires a small server route using the `docx` npm package.

## Local setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env.local` and add your real Anthropic API key:
   ```
   cp .env.example .env.local
   ```
3. Run it:
   ```
   npm run dev
   ```
4. Open http://localhost:3000

## Adding Stripe (real payments)

1. Create a Stripe account and get your secret key.
2. Add a new API route, e.g. `app/api/checkout/route.js`, that creates a Stripe Checkout Session for $25 and returns its URL.
3. Replace the "Pay $25 to continue" button's `simulatePayment()` call with a redirect to that Checkout URL.
4. Add a webhook route (`app/api/webhook/route.js`) that listens for `checkout.session.completed` and marks the application as paid in your database.
5. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to your environment variables.

## Adding a database and accounts

The build spec calls for Postgres via Supabase. Rough path:
1. Create a Supabase project, add the `User`, `Application`, `Requirement`, `BackgroundProfile`, and `SkillsSummary` tables from the build spec's data model.
2. Add Supabase Auth (email/password or SSO) for sign-in.
3. Replace the `localStorage` calls in `components/ECareerDesign.jsx` with calls to Supabase, scoped to the signed-in user.

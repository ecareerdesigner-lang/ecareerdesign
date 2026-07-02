# eCareerDesign

STAR-format response builder for internal USPS eCareer applications.

## What works out of the box
- Job title entry, sample requirement library, and paste-a-posting extraction (AI-powered)
- Background profile intake, saved in the browser (localStorage)
- STAR response generation and regeneration per requirement, defensively capped at your character budget
- Special Skills & Associations summary generation
- Copy-to-clipboard and plain-text export
- Real Stripe Checkout for the $25 fee (see setup below)

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

## Setting up Stripe (real payments)

1. Create a Stripe account at https://dashboard.stripe.com/register if you don't have one.
2. In the Stripe Dashboard, make sure you're in **Test mode** first (toggle top-right) — use test payments until everything works end to end.
3. Go to **Developers → API keys** and copy the **Secret key** (starts with `sk_test_...`).
4. Add it to your environment as `STRIPE_SECRET_KEY` — locally in `.env.local`, and in Vercel under **Settings → Environment Variables**.
5. Test with Stripe's test card: `4242 4242 4242 4242`, any future expiry date, any CVC, any ZIP.
6. Once you're confident it works, switch the Stripe Dashboard to **Live mode**, generate a new live secret key (starts with `sk_live_...`), and replace `STRIPE_SECRET_KEY` in Vercel with that value. Redeploy after changing it.

No webhook is required for this integration — payment is confirmed directly via `stripe.checkout.sessions.retrieve` when the user is redirected back from Checkout. If you later add a database, consider also adding a webhook (`checkout.session.completed`) as a more durable source of truth.

## Adding a database and accounts

The build spec calls for Postgres via Supabase. Rough path:
1. Create a Supabase project, add the `User`, `Application`, `Requirement`, `BackgroundProfile`, and `SkillsSummary` tables from the build spec's data model.
2. Add Supabase Auth (email/password or SSO) for sign-in.
3. Replace the `localStorage` calls in `components/ECareerDesign.jsx` with calls to Supabase, scoped to the signed-in user.

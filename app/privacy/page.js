import { pageMeta } from "../../lib/seo";
import { NEW_PAGES, DocPage } from "../../components/public/Blocks";

export const metadata = pageMeta({
  title: "Privacy Notice | eCareer Design",
  description: "Learn what personal data eCareer Design collects, why we collect it, how it's used, and the choices you have to control or delete it.",
  path: "/privacy",
});

const styles = {
  page: { maxWidth: 760, margin: "0 auto", padding: "3rem 1.5rem", fontFamily: "Georgia, 'Times New Roman', serif", color: "#16283D", lineHeight: 1.7 },
  h1: { fontSize: 34, fontWeight: 700, marginBottom: 4 },
  updated: { fontSize: 13, color: "#6B7280", fontFamily: "Arial, sans-serif", marginBottom: 32 },
  h2: { fontSize: 22, marginTop: 40, marginBottom: 10 },
  p: { fontSize: 16, marginBottom: 16, fontFamily: "Arial, sans-serif", color: "#1a1a1a" },
  ul: { fontSize: 16, marginBottom: 16, fontFamily: "Arial, sans-serif", color: "#1a1a1a", paddingLeft: 22 },
  li: { marginBottom: 8 },
  note: { fontSize: 14, background: "#FDE3CC", border: "1px solid #F2660A", borderRadius: 8, padding: "12px 16px", fontFamily: "Arial, sans-serif", color: "#5C3410", marginBottom: 32 },
  back: { fontSize: 14, fontFamily: "Arial, sans-serif", color: "#F2660A", textDecoration: "none" },
};

// Same keys as `styles`, restyled. Only used when the new public look is on.
const newStyles = {
  updated: {}, h2: { fontFamily: "var(--np-display), Georgia, serif", fontSize: 26, fontWeight: 600, margin: "40px 0 10px", color: "#16283D", letterSpacing: "-0.01em" },
  p: { fontSize: 16.5, lineHeight: 1.75, marginBottom: 16, color: "#2A3B52" },
  ul: { fontSize: 16.5, lineHeight: 1.75, marginBottom: 16, color: "#2A3B52", paddingLeft: 22 },
  li: { marginBottom: 8 },
  note: { fontSize: 14.5, background: "#FDE3CC", border: "1px solid #F3C9A4", borderRadius: 16, padding: "16px 20px", color: "#5C3410", margin: "32px 0 0" },
};
const s = NEW_PAGES ? newStyles : styles;

function Body() {
  return (
    <>

      <p style={s.p}>
        eCareer Design helps you draft resumes, cover letters, tailored job application responses, and interview practice sessions.
        Doing that well requires personal information — your name, contact details, and work history. This page explains, in plain
        language, what we collect, why, and where it goes.
      </p>

      <h2 style={s.h2}>The short version</h2>
      <ul style={s.ul}>
        <li style={s.li}>If you use the free tools without an account, what you type is stored only in your own browser (using a technology called <code>localStorage</code>) — not on our servers. If you create an account or use Premium features, including the Apply Assistant browser extension, some information is stored on our servers, as described below.</li>
        <li style={s.li}>To generate content, what you type is sent to Anthropic's AI API to produce a response, then returned to your browser. We don't separately log or retain that content ourselves.</li>
        <li style={s.li}>If you use the job search feature, your search terms (job title, location) are sent to the job search services you enable — not your full background.</li>
        <li style={s.li}>Clearing your browser's site data deletes what the free tools keep in your browser. Information saved to your account lives on our servers; to have it deleted, email us at the address below.</li>
      </ul>

      <h2 style={s.h2}>What we collect</h2>
      <p style={s.p}>Information you actively type into the app, which may include:</p>
      <ul style={s.ul}>
        <li style={s.li}>Name, email, phone number, and location (for resumes and cover letters)</li>
        <li style={s.li}>Work history: job titles, employers, dates, and descriptions</li>
        <li style={s.li}>Education, training records, and certifications</li>
        <li style={s.li}>Job postings you paste in to tailor a response or generate a mock interview</li>
        <li style={s.li}>Your typed answers during interview practice sessions</li>
      </ul>
      <p style={s.p}>
        We also use Vercel Analytics and Vercel Speed Insights to understand overall traffic and site performance. These tools are
        designed to be privacy-friendly: they report aggregate page-view and performance data and do not use tracking cookies or
        collect information that identifies you personally.
      </p>

      <h2 style={s.h2}>Where your information goes</h2>
      <p style={s.p}><strong>Anthropic (AI generation).</strong> When you generate a resume section, cover letter, response, or interview question, the relevant text is sent to Anthropic's API to produce the result. This happens through our own server, so Anthropic does not see your identity separately from the content of the request. Anthropic's own handling of API data is governed by their commercial terms and privacy policy — see <a href="https://www.anthropic.com/legal/privacy" style={{color:"#F2660A"}}>anthropic.com/legal/privacy</a> for specifics on retention and use.</p>
      <p style={s.p}><strong>Job search services (optional, only if you use that feature).</strong> If configured, your search terms may be sent to USAJOBS, Adzuna, and/or Jooble to return matching postings. Only the title and location you type into that specific search box are sent — not your resume or background.</p>
      <p style={s.p}><strong>Other job boards.</strong> The "search directly on" buttons (Indeed, LinkedIn, ZipRecruiter, Monster, and others) simply open that site's own search page in a new tab, pre-filled with your search terms. We don't send them anything beyond what's visible in that URL, and once you click through, you're on their site under their own privacy policy.</p>
      <p style={s.p}><strong>Vercel (hosting).</strong> The app itself is hosted on Vercel, which processes standard web traffic (like any website) to serve the pages you request.</p>

      <h2 style={s.h2}>Accounts, payments, and Premium features</h2>
      <p style={s.p}>
        If you create an account, we store your sign-in details with our database provider, Supabase, along with your Premium status
        and any resume profile you save to your account. Payments are handled by Stripe; we receive confirmation of your plan but
        never see your card number. If you subscribe to email updates or score emails, we use Resend to send them, and every email
        includes an unsubscribe link.
      </p>

      <h2 style={s.h2}>Apply Assistant browser extension (Premium)</h2>
      <p style={s.p}>
        The eCareer Design Apply Assistant is a Chrome extension that finds roles that fit your resume, writes a tailored resume and
        cover letter for each, and fills in application forms. You approve every submission yourself; the extension never sends an
        application on its own. Here is exactly what it does with information:
      </p>
      <ul style={s.ul}>
        <li style={s.li}><strong>Connecting.</strong> You paste a one-time code from your eCareer Design account into the extension. The extension then keeps a private access token in your browser. We store only a scrambled (hashed) copy of that token on our servers. It expires after 90 days, and you can disconnect any browser from your Dashboard at any time, which stops it working immediately.</li>
        <li style={s.li}><strong>Finding roles.</strong> When you click Find roles, our server reads the resume profile saved in your account and sends your resume text and the job descriptions it finds to Anthropic's AI API to rank them. Job search services (USAJOBS, Adzuna, and public employer job boards on Greenhouse and Lever, plus Remotive for remote roles) receive only a job title and location, never your resume or contact details.</li>
        <li style={s.li}><strong>Preparing an application.</strong> The job posting text and your resume are sent to Anthropic's API to produce a match score, a tailored resume, and a cover letter. We save the result (job title, company, link, score, tailored resume, cover letter, and status) to your account so you can see it in History and download it. We also keep a daily count of how many times you used the feature, to enforce fair-use limits.</li>
        <li style={s.li}><strong>Reading web pages.</strong> The extension reads a page only when you ask it to: by clicking "Score this page" or by filling an application. It asks Chrome for permission for each site, and it does not collect or store your browsing history.</li>
        <li style={s.li}><strong>Filling forms.</strong> Your saved name, contact details, and the generated documents are placed into the form on your own screen. The extension does not answer legal, demographic, or work-authorization questions, does not solve CAPTCHAs, does not create accounts, and does not type passwords.</li>
        <li style={s.li}><strong>What stays in your browser.</strong> The access token, your panel preferences, and your most recent job matches (until you close the browser) are stored in the extension's own storage in Chrome.</li>
      </ul>
      <p style={s.p}>
        The information the extension handles is used only to provide the features described above. We don't sell it, we don't use
        it for advertising, and we don't use it to build profiles for unrelated purposes. We don't transfer it to anyone except the
        services named above that are needed to run these features. To delete your saved applications or account information, email{" "}
        <a href="mailto:privacy@ecareerdesign.net" style={{ color: "#F2660A" }}>privacy@ecareerdesign.net</a>.
      </p>

      <h2 style={s.h2}>What we don't do</h2>
      <ul style={s.ul}>
        <li style={s.li}>We don't sell your information, and we don't use it for advertising.</li>
        <li style={s.li}>We don't require an account to use the free tools. An account is needed for Premium features and the Apply Assistant extension.</li>
        <li style={s.li}>We don't share your background information with employers, recruiters, or anyone else — the only place your content goes is into the AI generation request you trigger, and back to your own screen.</li>
      </ul>

      <h2 style={s.h2}>Your control over your information</h2>
      <p style={s.p}>
        For the free tools, your information lives in your browser, so you can clear it at any time by clearing your browser's site
        data/cookies for eCareer Design, or by using a private/incognito browsing window. For account information and saved
        applications, you can disconnect extension browsers from your Dashboard, and you can email us to request deletion.
      </p>

      <h2 style={s.h2}>Children's privacy</h2>
      <p style={s.p}>eCareer Design is intended for job seekers and is not directed at children. We don't knowingly collect information from children under 13.</p>

      <h2 style={s.h2}>Changes to this notice</h2>
      <p style={s.p}>If what we collect or how we use it changes in a meaningful way — for example, if we add new features that use your data — we'll update this page and change the "last updated" date above.</p>

      <h2 style={s.h2}>Questions</h2>
      <p style={s.p}>
        If you have questions about this notice, contact us at{" "}
        <a href="mailto:privacy@ecareerdesign.net" style={{ color: "#F2660A" }}>privacy@ecareerdesign.net</a>.
      </p>

      <div style={s.note}>
        Note: this page is a plain-language description of this app's actual data handling, written by the developer with AI
        assistance — it is not a substitute for review by a qualified attorney, and isn't legal advice. If eCareer Design grows to
        handle meaningfully more users or more sensitive data, it's worth having an actual privacy attorney review this page.
      </div>
    </>
  );
}

export default function PrivacyPage() {
  if (NEW_PAGES) {
    return (
      <DocPage title="Privacy Notice" updated="Last updated: November 2026">
        <Body />
      </DocPage>
    );
  }
  return (
    <div style={styles.page}>
      <a href="/" style={styles.back}>&larr; Back to eCareer Design</a>
      <h1 style={styles.h1}>Privacy Notice</h1>
      <p style={styles.updated}>Last updated: November 2026</p>
      <Body />
    </div>
  );
}

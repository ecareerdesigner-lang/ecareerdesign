export const metadata = {
  title: "Privacy Notice | eCareer Design",
  description: "What eCareer Design collects, why, and where it goes.",
};

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

export default function PrivacyPage() {
  return (
    <div style={styles.page}>
      <a href="/" style={styles.back}>&larr; Back to eCareer Design</a>
      <h1 style={styles.h1}>Privacy Notice</h1>
      <p style={styles.updated}>Last updated: July 2026</p>

      <p style={styles.p}>
        eCareer Design helps you draft resumes, cover letters, tailored job application responses, and interview practice sessions.
        Doing that well requires personal information — your name, contact details, and work history. This page explains, in plain
        language, what we collect, why, and where it goes.
      </p>

<h2 style={styles.h2}>The short version</h2>
      <ul style={styles.ul}>
        <li style={styles.li}>You can use eCareer Design without creating an account — in that case, everything you type is stored only in your own browser (using a technology called <code>localStorage</code>) and never reaches our servers. If you create an account, your resume and application information is saved to our database so it's available when you log in from any device.</li>
        <li style={styles.li}>To generate content, what you type is sent to Anthropic's AI API to produce a response, then returned to your browser. We don't separately log or retain that content ourselves.</li>
        <li style={styles.li}>If you use the job search feature, your search terms (job title, location) are sent to the job search services you enable — not your full background.</li>
        <li style={styles.li}>If you don't create an account, clearing your browser's site data for eCareer Design deletes everything we have, since it only ever lived in your browser. If you do create an account, you can delete your saved data at any time — see "Your control over your information" below.</li>
      </ul>

      <h2 style={styles.h2}>What we collect</h2>
      <p style={styles.p}>Information you actively type into the app, which may include:</p>
      <ul style={styles.ul}>
        <li style={styles.li}>Name, email, phone number, and location (for resumes and cover letters)</li>
        <li style={styles.li}>Work history: job titles, employers, dates, and descriptions</li>
        <li style={styles.li}>Education, training records, and certifications</li>
        <li style={styles.li}>Job postings you paste in to tailor a response or generate a mock interview</li>
        <li style={styles.li}>Your typed answers during interview practice sessions</li>
        <li style={styles.li}>If you create an account, your email address and a securely stored (encrypted) password</li>
      </ul>
      <p style={styles.p}>
        We also use Vercel Analytics and Vercel Speed Insights to understand overall traffic and site performance. These tools are
        designed to be privacy-friendly: they report aggregate page-view and performance data and do not use tracking cookies or
        collect information that identifies you personally.
      </p>

      <h2 style={styles.h2}>Where your information goes</h2>
      <p style={styles.p}><strong>Anthropic (AI generation).</strong> When you generate a resume section, cover letter, response, or interview question, the relevant text is sent to Anthropic's API to produce the result. This happens through our own server, so Anthropic does not see your identity separately from the content of the request. Anthropic's own handling of API data is governed by their commercial terms and privacy policy — see <a href="https://www.anthropic.com/legal/privacy" style={{color:"#F2660A"}}>anthropic.com/legal/privacy</a> for specifics on retention and use.</p>
      <p style={styles.p}><strong>Supabase (accounts and database, only if you create an account).</strong> If you sign up for an account, your login credentials and saved resume/application data are stored with Supabase, our database and authentication provider. This lets your information follow you across devices when you log in. If you never create an account, Supabase is not involved at all.</p>
      <p style={styles.p}><strong>Job search services (optional, only if you use that feature).</strong> If configured, your search terms may be sent to USAJOBS, Adzuna, and/or Jooble to return matching postings. Only the title and location you type into that specific search box are sent — not your resume or background.</p>
      <p style={styles.p}><strong>Other job boards.</strong> The "search directly on" buttons (Indeed, LinkedIn, ZipRecruiter, Monster, and others) simply open that site's own search page in a new tab, pre-filled with your search terms. We don't send them anything beyond what's visible in that URL, and once you click through, you're on their site under their own privacy policy.</p>
      <p style={styles.p}><strong>Vercel (hosting).</strong> The app itself is hosted on Vercel, which processes standard web traffic (like any website) to serve the pages you request.</p>

      <h2 style={styles.h2}>What we don't do</h2>
      <ul style={styles.ul}>
        <li style={styles.li}>We don't sell your information.</li>
        <li style={styles.li}>Creating an account is optional — the app is fully usable without one.</li>
        <li style={styles.li}>We don't share your background information with employers, recruiters, or anyone else — the only place your content goes is into the AI generation request you trigger, and back to your own screen (or, if you have an account, into your own saved data).</li>
      </ul>

      <h2 style={styles.h2}>Your control over your information</h2>
      <p style={styles.p}>
        If you don't create an account, your information lives only in your browser, and you're always in control of it — clear it
        at any time by clearing your browser's site data/cookies for eCareer Design, or use a private/incognito browsing window,
        which won't save anything after you close it.
      </p>
      <p style={styles.p}>
        If you create an account, your saved resume and application data is stored in our database so it's available when you log
        in from a different device. You can request deletion of your account and all associated data at any time by contacting us
        at the email below.
      </p>

      <h2 style={styles.h2}>Children's privacy</h2>
      <p style={styles.p}>eCareer Design is intended for job seekers and is not directed at children. We don't knowingly collect information from children under 13.</p>

      <h2 style={styles.h2}>Changes to this notice</h2>
      <p style={styles.p}>If what we collect or how we use it changes in a meaningful way, we'll update this page and change the "last updated" date above.</p>

      <h2 style={styles.h2}>Questions</h2>
      <p style={styles.p}>
        If you have questions about this notice, contact us at{" "}
        <a href="mailto:privacy@ecareerdesign.net" style={{ color: "#F2660A" }}>privacy@ecareerdesign.net</a>.
      </p>

      <div style={styles.note}>
        Note: this page is a plain-language description of this app's actual data handling, written by the developer with AI
        assistance — it is not a substitute for review by a qualified attorney, and isn't legal advice. If eCareer Design grows to
        handle meaningfully more users or more sensitive data, it's worth having an actual privacy attorney review this page.
      </div>
    </div>
  );
}

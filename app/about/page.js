import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_PROOF } from "../../lib/siteProof";

// /about renders only once the founder block in lib/siteProof.js is filled in.
// Until then it 404s on purpose: no placeholder copy ships to production.
export const metadata = {
  title: "About eCareer Design: Why I Built It",
  description: "Who builds eCareer Design and why: an AI resume builder made for career changers, returners and federal applicants.",
  alternates: { canonical: "https://www.ecareerdesign.net/about" },
};

export default function AboutPage() {
  const f = SITE_PROOF.founder;
  if (!f) notFound();
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, Segoe UI, Roboto, sans-serif", background: "#EEF0EC", minHeight: "100vh", color: "#16283D" }}>
      <header style={{ maxWidth: 760, margin: "0 auto", padding: "18px 20px" }}>
        <Link href="/" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 20, color: "#16283D", textDecoration: "none" }}>
          eCareer Design
        </Link>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 64px" }}>
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, fontSize: 38, margin: "0 0 24px" }}>Why I built eCareer Design</h1>
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 24 }}>
          {f.photo && <img src={f.photo} alt={f.name} width={88} height={88} style={{ borderRadius: "50%", objectFit: "cover" }} />}
          <p style={{ margin: 0, fontSize: 17 }}>
            <b>{f.name}</b>{f.role ? `, ${f.role}` : ""}
            {f.linkedin && <><br /><a href={f.linkedin} rel="noopener noreferrer" style={{ color: "#2F5D8F" }}>LinkedIn</a></>}
          </p>
        </div>
        <p style={{ fontSize: 17, lineHeight: 1.7, color: "#3C5069", whiteSpace: "pre-line" }}>{f.story}</p>
        <p style={{ marginTop: 32 }}>
          <Link href="/ats-checker" style={{ color: "#F2660A", fontWeight: 600 }}>Scan my resume free</Link>
          {" · "}
          <a href="mailto:hello@ecareerdesign.net" style={{ color: "#2F5D8F" }}>hello@ecareerdesign.net</a>
        </p>
      </main>
    </div>
  );
}

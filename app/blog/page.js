import Link from "next/link";
import { supabase } from "../../lib/supabase";

import { pageMeta } from "../../lib/seo";
import { NEW_PAGES, PublicShell, PageHero, Page } from "../../components/public/Blocks";

export const metadata = pageMeta({
  title: "Career Advice Blog | eCareer Design",
  description: "Practical resume tips, ATS insights, and job search strategies from eCareer Design to help you write stronger applications and land more interviews.",
  path: "/blog",
});

export const revalidate = 60;

const FEATURED_SLUG = "eligible-but-not-referred-federal-jobs";

export default async function BlogIndex() {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, meta_description, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const featured = (posts || []).find((post) => post.slug === FEATURED_SLUG);
  const rest = (posts || []).filter((post) => post.slug !== FEATURED_SLUG);

  if (NEW_PAGES) {
    return (
      <PublicShell>
        <PageHero eyebrow="Blog" title="Career Advice" lead="Resume tips, ATS insights, and job search advice." img="/landing/desk.jpg" />
        <Page narrow>
          <div className="np-card np-card-dark" style={{ marginBottom: 24 }}>
            <p className="np-eyebrow" style={{ color: "#FDE3CC" }}>Free tool</p>
            <p style={{ fontFamily: "var(--np-display), Georgia, serif", fontSize: 22, lineHeight: 1.3, margin: "8px 0 18px" }}>
              See how well your resume matches any job description — free, no account required.
            </p>
            <a href="/resume-job-match" className="np-btn np-btn-or">Get My Match Score</a>
          </div>
          <div className="np-posts">
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="np-post np-post-feat">
                <span className="np-eyebrow">Reader Favorite</span>
                <h2>{featured.title}</h2>
                <p>{featured.meta_description}</p>
              </Link>
            )}
            {(!posts || posts.length === 0) && <p style={{ color: "#3C5069" }}>No posts yet — check back soon.</p>}
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="np-post">
                <h2>{post.title}</h2>
                <p>{post.meta_description}</p>
              </Link>
            ))}
          </div>
        </Page>
        <div style={{ height: 64 }} />
      </PublicShell>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <Link href="/" style={{ color: "#3C5069", fontSize: 14, textDecoration: "none" }}>← Home</Link>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: "#16283D", margin: "16px 0 8px" }}>
        Career Advice
      </h1>
      <p style={{ fontSize: 16, color: "#3C5069", marginBottom: 40 }}>
        Resume tips, ATS insights, and job search advice.
      </p>

      <div style={{ background: "#16283D", borderRadius: 16, padding: "1.5rem 1.75rem", marginBottom: 40 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#FDE3CC", margin: "0 0 8px" }}>
          Free tool
        </p>
        <p style={{ fontSize: 17, color: "#fff", margin: "0 0 16px", lineHeight: 1.4, fontFamily: "'Fraunces', serif" }}>
          See how well your resume matches any job description — free, no account required.
        </p>
        <Link
          href="/resume-job-match"
          style={{ display: "inline-block", background: "#F2660A", color: "#fff", fontWeight: 600, fontSize: 15, padding: "11px 22px", borderRadius: 10, textDecoration: "none" }}
        >
          Get My Match Score
        </Link>
      </div>

      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          style={{ textDecoration: "none", display: "block", marginBottom: 40, padding: 24, borderRadius: 16, border: "1.5px solid #F2660A", background: "#FDE3CC22" }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#F2660A", margin: "0 0 10px" }}>
            Reader Favorite
          </p>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: "#16283D", margin: "0 0 8px" }}>
            {featured.title}
          </h2>
          <p style={{ fontSize: 15, color: "#3C5069", margin: 0, lineHeight: 1.5 }}>
            {featured.meta_description}
          </p>
        </Link>
      )}

      {(!posts || posts.length === 0) && (
        <p style={{ color: "#3C5069" }}>No posts yet — check back soon.</p>
      )}

      {rest.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          style={{ textDecoration: "none", display: "block", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #D7DBD6" }}
        >
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#16283D", margin: "0 0 8px" }}>
            {post.title}
          </h2>
          <p style={{ fontSize: 15, color: "#3C5069", margin: 0, lineHeight: 1.5 }}>
            {post.meta_description}
          </p>
        </Link>
      ))}
    </div>
  );
}
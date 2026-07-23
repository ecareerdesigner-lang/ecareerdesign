import Link from "next/link";
import { supabase } from "../../lib/supabase";

export const metadata = {
  title: "Career Advice Blog | eCareer Design",
  description: "Resume tips, ATS insights, and job search advice to help you land more interviews.",
};

export const revalidate = 60;

export default async function BlogIndex() {
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, meta_description, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <Link href="/" style={{ color: "#3C5069", fontSize: 14, textDecoration: "none" }}>← Home</Link>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: "#16283D", margin: "16px 0 8px" }}>
        Career Advice
      </h1>
      <p style={{ fontSize: 16, color: "#3C5069", marginBottom: 40 }}>
        Resume tips, ATS insights, and job search advice.
      </p>

      {(!posts || posts.length === 0) && (
        <p style={{ color: "#3C5069" }}>No posts yet — check back soon.</p>
      )}

      {(posts || []).map((post) => (
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
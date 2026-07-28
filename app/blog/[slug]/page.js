import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { supabase } from "../../../lib/supabase";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_title, meta_description")
    .eq("slug", params.slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) {
    return { title: "Post Not Found | eCareer Design" };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || undefined,
  };
}

export default async function BlogPost({ params }) {
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, content, published_at")
    .eq("slug", params.slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  // The page's own <h1> (below) is the post title. If a post's markdown
  // content happens to use a top-level "#" heading too, downgrade it to an
  // <h2> so every page has exactly one H1, never zero and never multiple.
  const rawHtml = marked.parse(post.content || "");
  const html = rawHtml.replace(/<h1(\s|>)/gi, "<h2$1").replace(/<\/h1>/gi, "</h2>");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <Link href="/blog" style={{ color: "#3C5069", fontSize: 14, textDecoration: "none" }}>← All Posts</Link>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, color: "#16283D", margin: "20px 0 8px", lineHeight: 1.25 }}>
        {post.title}
      </h1>
      <article
        style={{ marginTop: 24, fontSize: 16, lineHeight: 1.7, color: "#16283D" }}
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .blog-content h1, .blog-content h2, .blog-content h3 {
          font-family: Fraunces, serif;
          color: #16283D;
          margin-top: 32px;
          margin-bottom: 12px;
        }
        .blog-content h1 { font-size: 32px; }
        .blog-content h2 { font-size: 24px; }
        .blog-content h3 { font-size: 20px; }
        .blog-content p { margin: 0 0 16px; }
        .blog-content ul, .blog-content ol { margin: 0 0 16px; padding-left: 24px; }
        .blog-content li { margin-bottom: 6px; }
        .blog-content strong { color: #16283D; }
        .blog-content hr { border: none; border-top: 1px solid #D7DBD6; margin: 32px 0; }
        .blog-content a { color: #F2660A; }
      `}</style>
    </div>
  );
}

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

// Blog posts don't share one consistent FAQ markdown format (plain
// alternating question/answer lines, bold-question-plus-inline-answer, or
// heading-per-question), so this parses all three shapes rather than
// assuming one. Used to emit FAQPage structured data -- if nothing matches,
// it returns an empty list and no schema is emitted, rather than guessing.
function extractFaqPairs(rawContent) {
  if (!rawContent) return [];
  const content = rawContent.replace(/\r\n/g, "\n");
  const headingMatch = content.match(/^[ \t]*#{0,3}[ \t]*Frequently Asked Questions.*$/im);
  if (!headingMatch) return [];
  const afterHeading = content.slice(headingMatch.index + headingMatch[0].length);
  const endMatch = afterHeading.match(/\n_{10,}\n|\n---\n/);
  const body = (endMatch ? afterHeading.slice(0, endMatch.index) : afterHeading).trim();
  if (!body) return [];

  const stripWrap = (s) =>
    s.trim().replace(/^#+\s*/, "").replace(/^\*\*([\s\S]*)\*\*$/, "$1").trim();
  const isQuestion = (s) => stripWrap(s).endsWith("?");
  const cleanText = (s) =>
    s
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

  const chunks = body.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  const pairs = [];

  if (chunks.length <= 1) {
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i + 1 < lines.length; i += 2) {
      if (lines[i].endsWith("?")) {
        pairs.push([cleanText(lines[i]), cleanText(lines[i + 1])]);
      }
    }
    return pairs.filter(([q, a]) => q && a);
  }

  let i = 0;
  while (i < chunks.length) {
    const chunk = chunks[i];
    const inlineMatch = chunk.match(/^\*\*([^*]+\?)\*\*\s*([\s\S]*)$/);
    if (inlineMatch && inlineMatch[2].trim()) {
      pairs.push([cleanText(inlineMatch[1]), cleanText(inlineMatch[2])]);
      i += 1;
      continue;
    }
    if (isQuestion(chunk)) {
      const q = stripWrap(chunk);
      let j = i + 1;
      const answerParts = [];
      while (j < chunks.length && !isQuestion(chunks[j]) && !chunks[j].match(/^\*\*([^*]+\?)\*\*/)) {
        answerParts.push(chunks[j]);
        j += 1;
      }
      if (answerParts.length) {
        pairs.push([cleanText(q), cleanText(answerParts.join(" "))]);
      }
      i = j;
      continue;
    }
    i += 1;
  }
  return pairs.filter(([q, a]) => q && a);
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

  const faqPairs = extractFaqPairs(post.content);
  const faqSchema = faqPairs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqPairs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
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

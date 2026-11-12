import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { supabase } from "../../../lib/supabase";
import { SITE_URL, fitDescription, fitTitle, pageMeta } from "../../../lib/seo";
import { getDefaultAuthor } from "../../../lib/authors";
import { NEW_PAGES, PublicShell, PageHero, Page } from "../../../components/public/Blocks";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_title, meta_description, content")
    .eq("slug", params.slug)
    .eq("published", true)
    .maybeSingle();

  if (!post) {
    return { title: "Post Not Found | eCareer Design" };
  }

  return pageMeta({
    // 30-60 characters: the stored SEO title when it fits, otherwise the post
    // title, otherwise shortened (and logged) rather than cut silently.
    title: fitTitle(post.meta_title, post.title),
    // Share cards use the post's own title, not the (often longer) SEO title.
    ogTitle: post.title,
    // 110-160 characters: the stored description when it fits, otherwise built
    // from the article's opening paragraph.
    description: fitDescription(post.meta_description, post.content),
    path: `/blog/${params.slug}`,
    ogType: "article",
  });
}

const STOP_WORDS = new Set([
  "resume", "resumes", "your", "with", "from", "that", "this", "what", "when", "into", "about",
  "gets", "getting", "write", "how", "the", "for", "and", "you", "not", "are", "why",
]);

function titleWords(title) {
  return new Set(
    String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  );
}

// Up to five links under every article: the three posts whose titles share the
// most topic words, plus the next-older and next-newer post. The neighbours
// guarantee every post at least one inbound link; the rest are chosen by topic.
function pickRelated(slug, posts) {
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx < 0) return [];
  const mine = titleWords(posts[idx].title);
  const scored = posts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      let shared = 0;
      titleWords(p.title).forEach((w) => { if (mine.has(w)) shared += 1; });
      return { p, shared };
    })
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || new Date(b.p.published_at) - new Date(a.p.published_at));
  const picks = [];
  const add = (p) => { if (p && p.slug !== slug && !picks.some((x) => x.slug === p.slug)) picks.push(p); };
  scored.slice(0, 3).forEach((x) => add(x.p));
  add(posts[idx + 1]);
  add(posts[idx - 1]);
  return picks.slice(0, 5);
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
    .select("title, content, published_at, updated_at")
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

  const { data: allPosts } = await supabase
    .from("blog_posts")
    .select("slug, title, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  const related = pickRelated(params.slug, allPosts || []);
  const author = getDefaultAuthor();
  const postUrl = `${SITE_URL}/blog/${params.slug}`;

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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    // A real person (with an author page and profile links) when one is set in
    // lib/authors.js; otherwise the organization, as before.
    author: author
      ? {
          "@type": "Person",
          name: author.name,
          url: `${SITE_URL}/author/${author.slug}`,
          ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}),
          ...(author.sameAs && author.sameAs.length ? { sameAs: author.sameAs } : {}),
        }
      : { "@type": "Organization", name: "eCareer Design" },
    publisher: { "@type": "Organization", name: "eCareer Design", url: SITE_URL },
    mainEntityOfPage: postUrl,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  if (NEW_PAGES) {
    return (
      <PublicShell>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} />
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
        <PageHero back={["/blog", "All posts"]} eyebrow="Career Advice" title={post.title} img="/landing/desk.jpg">
          {author && (
            <p className="np-small">
              Drafted with AI assistance (Claude), reviewed and edited by{" "}
              <Link href={`/author/${author.slug}`} style={{ color: "#FFB07A", fontWeight: 600 }}>{author.name}</Link>
            </p>
          )}
        </PageHero>
        <div className="np-narrow" style={{ marginTop: -28, position: "relative" }}>
          <div className="np-paper">
            <article className="np-prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
          {related.length > 0 && (
            <nav aria-label="Related articles" style={{ marginTop: 32 }}>
              <h2 className="np-h3">Keep reading</h2>
              <div className="np-posts">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="np-post"><h2 style={{ fontSize: 19, margin: 0 }}>{r.title}</h2></Link>
                ))}
              </div>
            </nav>
          )}
        </div>
        <div style={{ height: 64 }} />
      </PublicShell>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <nav aria-label="Breadcrumb" style={{ fontSize: 14, color: "#3C5069" }}>
        <Link href="/" style={{ color: "#3C5069", textDecoration: "none" }}>Home</Link>
        {" / "}
        <Link href="/blog" style={{ color: "#3C5069", textDecoration: "none" }}>Blog</Link>
        {" / "}
        <span aria-current="page">{post.title}</span>
      </nav>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, color: "#16283D", margin: "20px 0 8px", lineHeight: 1.25 }}>
        {post.title}
      </h1>
      {author && (
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "#3C5069" }}>
          Drafted with AI assistance (Claude), reviewed and edited by{" "}
          <Link href={`/author/${author.slug}`} style={{ color: "#F2660A" }}>{author.name}</Link>
        </p>
      )}
      <article
        style={{ marginTop: 24, fontSize: 16, lineHeight: 1.7, color: "#16283D" }}
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {related.length > 0 && (
        <nav aria-label="Related articles" style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #D7DBD6" }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: "#16283D", margin: "0 0 12px" }}>Keep reading</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/blog/${r.slug}`} style={{ color: "#F2660A" }}>{r.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
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

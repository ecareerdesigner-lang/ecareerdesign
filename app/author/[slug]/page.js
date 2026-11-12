import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { AUTHORS, getAuthor } from "../../../lib/authors";
import { SITE_URL, pageMeta } from "../../../lib/seo";
import { NEW_PAGES, PublicShell, PageHero, Page } from "../../../components/public/Blocks";

export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return AUTHORS.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }) {
  const author = getAuthor(params.slug);
  if (!author) return { title: "Author not found | eCareer Design" };
  return pageMeta({
    title: `${author.name}, ${author.jobTitle || "Author"} | eCareer Design`,
    description: author.bio,
    path: `/author/${author.slug}`,
    ogType: "profile",
  });
}

export default async function AuthorPage({ params }) {
  const author = getAuthor(params.slug);
  if (!author) notFound();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    jobTitle: author.jobTitle,
    url: `${SITE_URL}/author/${author.slug}`,
    ...(author.sameAs && author.sameAs.length ? { sameAs: author.sameAs } : {}),
  };

  if (NEW_PAGES) {
    return (
      <PublicShell>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema).replace(/</g, "\\u003c") }} />
        <PageHero back={["/blog", "All Posts"]} eyebrow="Author" title={author.name} lead={author.jobTitle || undefined} img="/landing/stones.jpg" />
        <Page narrow>
          <div className="np-paper">
            <p style={{ fontSize: 17, lineHeight: 1.75, margin: "0 0 16px" }}>{author.bio}</p>
            <p style={{ fontSize: 17, lineHeight: 1.75, margin: "0 0 16px" }}>
              Articles on eCareer Design are drafted with AI assistance (Claude), then reviewed and edited by {author.name} before they are published.
            </p>
            {author.experience && author.experience.length > 0 && (
              <>
                <h2 className="np-h3">Experience</h2>
                <ul className="np-list">{author.experience.map((line) => <li key={line}>{line}</li>)}</ul>
              </>
            )}
            {author.sameAs && author.sameAs.length > 0 && (
              <p style={{ marginTop: 24 }}>
                {author.sameAs.map((url) => (
                  <a key={url} href={url} rel="me noopener noreferrer" className="np-lnk" style={{ marginRight: 16 }}>{url.replace(/^https?:\/\/(www\.)?/, "")}</a>
                ))}
              </p>
            )}
            <h2 className="np-h3">Articles</h2>
            <ul className="np-list">
              {(posts || []).map((p) => (
                <li key={p.slug}><Link href={`/blog/${p.slug}`} className="np-lnk">{p.title}</Link></li>
              ))}
            </ul>
          </div>
        </Page>
        <div style={{ height: 64 }} />
      </PublicShell>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif", color: "#16283D" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema).replace(/</g, "\\u003c") }}
      />
      <Link href="/blog" style={{ color: "#3C5069", fontSize: 14, textDecoration: "none" }}>← All Posts</Link>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, margin: "20px 0 4px" }}>{author.name}</h1>
      {author.jobTitle && <p style={{ margin: "0 0 20px", color: "#3C5069" }}>{author.jobTitle}</p>}
      <p style={{ fontSize: 16, lineHeight: 1.7 }}>{author.bio}</p>
      <p style={{ fontSize: 16, lineHeight: 1.7 }}>
        Articles on eCareer Design are drafted with AI assistance (Claude), then reviewed and edited by {author.name} before they are published.
      </p>
      {author.experience && author.experience.length > 0 && (
        <>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginTop: 32 }}>Experience</h2>
          <ul style={{ lineHeight: 1.7 }}>
            {author.experience.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </>
      )}
      {author.sameAs && author.sameAs.length > 0 && (
        <p style={{ marginTop: 24 }}>
          {author.sameAs.map((url) => (
            <a key={url} href={url} rel="me noopener noreferrer" style={{ color: "#F2660A", marginRight: 16 }}>{url.replace(/^https?:\/\/(www\.)?/, "")}</a>
          ))}
        </p>
      )}
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, marginTop: 32 }}>Articles</h2>
      <ul style={{ lineHeight: 1.8 }}>
        {(posts || []).map((p) => (
          <li key={p.slug}><Link href={`/blog/${p.slug}`} style={{ color: "#16283D" }}>{p.title}</Link></li>
        ))}
      </ul>
    </div>
  );
}

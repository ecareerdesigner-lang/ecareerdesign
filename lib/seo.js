// Per-page SEO metadata. Next.js only merges `openGraph`/`twitter` shallowly,
// so a page without its own block inherits the root layout's values (generic
// title, same description). This helper returns title, description, canonical,
// Open Graph and Twitter fields together so each page shares correctly.
const SITE_URL = "https://www.ecareerdesign.net";

export function pageMeta({ title, description, path, ogTitle, ogType = "website" }) {
  const url = `${SITE_URL}${path}`;
  const shareTitle = ogTitle || title;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: shareTitle,
      description,
      url,
      siteName: "eCareer Design",
      type: ogType,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
    },
  };
}

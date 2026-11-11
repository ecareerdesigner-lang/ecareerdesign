// Per-page SEO metadata. Next.js only merges `openGraph`/`twitter` shallowly,
// so a page without its own block inherits the root layout's values (generic
// title, same description). This helper returns title, description, canonical,
// Open Graph and Twitter fields together so each page shares correctly.
// It also sets og:image / twitter:image: a page that exports its own
// `openGraph` block no longer inherits the file-based image from app/.
export const SITE_URL = "https://www.ecareerdesign.net";
const SHARE_IMAGE = `${SITE_URL}/og-default.png`; // 1200x630
const TWITTER_IMAGE = `${SITE_URL}/twitter-default.png`; // 1200x630
const SHARE_ALT = "eCareer Design: AI resume, cover letter and interview prep";

export function pageMeta({ title, description, path, ogTitle, ogDescription, ogType = "website" }) {
  const url = `${SITE_URL}${path}`;
  const shareTitle = ogTitle || title;
  const shareDescription = ogDescription || description;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: shareTitle,
      description: shareDescription,
      url,
      siteName: "eCareer Design",
      type: ogType,
      images: [{ url: SHARE_IMAGE, width: 1200, height: 630, alt: SHARE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: [TWITTER_IMAGE],
    },
  };
}

// ---- Title / description fitting for pages whose text comes from the database ----

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 110;
const DESC_MAX = 160;
const TRAILING_FILLER = /(?:[\s,:;\-–—|&]+|\b(?:and|or|the|a|an|to|for|of|in|on|with|your)\b)+$/i;

// Returns a 30-60 character title. Tries each candidate as written first
// (meta_title, then title). If none fits, shortens the first one at a word
// boundary (and logs it, so over-long titles are visible and can be fixed at
// the source instead of being cut silently).
export function fitTitle(...candidates) {
  const list = candidates.filter(Boolean).map((s) => String(s).replace(/\s+/g, " ").trim());
  const fits = list.find((t) => t.length >= TITLE_MIN && t.length <= TITLE_MAX);
  if (fits) return fits;
  const base = list[0] || "";
  if (base.length > TITLE_MAX) {
    console.warn(`[seo] title is ${base.length} chars (max ${TITLE_MAX}), shortened: "${base}"`);
    const cut = base.slice(0, TITLE_MAX + 1);
    const atWord = cut.slice(0, Math.max(cut.lastIndexOf(" "), TITLE_MIN));
    return atWord.replace(TRAILING_FILLER, "").trim();
  }
  if (base.length < TITLE_MIN) {
    console.warn(`[seo] title is ${base.length} chars (min ${TITLE_MIN}): "${base}"`);
    const withBrand = `${base} | eCareer Design`;
    if (withBrand.length <= TITLE_MAX) return withBrand;
  }
  return base;
}

// First real paragraph of a markdown body, as plain text.
export function plainFirstParagraph(markdown) {
  if (!markdown) return "";
  const blocks = String(markdown).replace(/\r\n/g, "\n").split(/\n\s*\n/);
  for (const block of blocks) {
    const text = block.trim();
    if (!text || /^(#|>|\||[-*+]\s|\d+[.)]\s|!\[|_{3,}|-{3,})/.test(text)) continue;
    const plain = text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (plain.length >= 80) return plain;
  }
  return "";
}

function clampDescription(text) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= DESC_MAX) return t;
  const window = t.slice(0, DESC_MAX);
  const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
  if (sentenceEnd + 1 >= DESC_MIN) return window.slice(0, sentenceEnd + 1);
  const room = t.slice(0, DESC_MAX - 1);
  return `${room.slice(0, room.lastIndexOf(" ")).replace(TRAILING_FILLER, "")}…`;
}

// Returns a 110-160 character description. Keeps the stored one when it fits;
// otherwise shortens it, or builds one from the article's opening paragraph.
export function fitDescription(description, content) {
  const stored = (description || "").replace(/\s+/g, " ").trim();
  if (stored.length >= DESC_MIN && stored.length <= DESC_MAX) return stored;
  for (const source of [stored, plainFirstParagraph(content)]) {
    if (!source) continue;
    const out = clampDescription(source);
    if (out.length >= DESC_MIN) return out;
  }
  return stored || undefined;
}

// Real people who write or edit articles. The audit asks for a named author
// with a Person schema, an author page and profile links, so this only accepts
// real details: fill in an entry, then set DEFAULT_AUTHOR_SLUG to its slug.
// While the list is empty, articles keep the "eCareer Design" organization
// byline and no author page is published.
//
// {
//   slug: "first-last",              // page lives at /author/first-last
//   name: "First Last",
//   jobTitle: "Federal resume writer",
//   bio: "Two or three plain sentences: what you do and how long you have done it.",
//   experience: ["Role, employer, years", "Another role"],
//   sameAs: ["https://www.linkedin.com/in/..."], // profiles this person actually runs
// }
export const AUTHORS = [];

// Slug of the person credited on every article until per-article authors exist.
export const DEFAULT_AUTHOR_SLUG = null;

export function getAuthor(slug) {
  return AUTHORS.find((a) => a.slug === slug) || null;
}

export function getDefaultAuthor() {
  return DEFAULT_AUTHOR_SLUG ? getAuthor(DEFAULT_AUTHOR_SLUG) : null;
}

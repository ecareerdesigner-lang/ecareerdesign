import { supabase } from "../lib/supabase";

export const revalidate = 3600;

export default async function sitemap() {
  const staticPages = [
    {
      url: "https://www.ecareerdesign.net",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.ecareerdesign.net/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.ecareerdesign.net/privacy",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://www.ecareerdesign.net/terms",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at")
    .eq("published", true);

  const blogPages = (posts || []).map((post) => ({
    url: `https://www.ecareerdesign.net/blog/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}

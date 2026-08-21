import { supabase } from '@/lib/supabase'

export default async function sitemap() {
  const baseUrl = 'https://www.ecareerdesign.net'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/cover-letter-generator`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/federal-resume-builder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/performance-review`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic blog posts from Supabase
  let blogPages = []
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, published_at, created_at')
      .eq('published', true)

    if (!error && posts) {
      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.published_at
          ? new Date(post.published_at)
          : post.created_at
          ? new Date(post.created_at)
          : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))
    }
  } catch (err) {
    console.error('Sitemap: failed to fetch blog posts', err)
  }

  return [...staticPages, ...blogPages]
}

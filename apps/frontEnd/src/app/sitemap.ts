import type { MetadataRoute } from 'next';
import { fetchAllPublishedPosts } from '@/lib/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  let posts: Awaited<ReturnType<typeof fetchAllPublishedPosts>> = [];
  try {
    posts = await fetchAllPublishedPosts();
  } catch {
    posts = [];
  }

  return [
    {
      url: site,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...posts.map((post) => ({
      url: `${site}/posts/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}

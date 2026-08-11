import { apiGet } from '@/lib/api';

export type TagSummary = { name: string; slug: string };

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt: string;
  tags: TagSummary[];
};

export type PostDetail = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt: string;
  updatedAt: string;
  tags: TagSummary[];
  category?: { name: string; slug: string } | null;
};

/** 统一还原路由里可能被编码 / 双重编码的 slug，再用于请求 */
export function normalizeSlugParam(slug: string): string {
  let current = slug;
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
}

export async function fetchAllPublishedPosts(): Promise<PostSummary[]> {
  const data = await apiGet<{ items: PostSummary[] }>('/posts?all=true', {
    cache: 'no-store',
  });
  return data.items ?? [];
}

export async function fetchPostBySlug(slug: string): Promise<PostDetail | null> {
  const normalized = normalizeSlugParam(slug);
  try {
    return await apiGet<PostDetail>(`/posts/${encodeURIComponent(normalized)}`, {
      cache: 'no-store',
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}

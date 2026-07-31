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

export async function fetchAllPublishedPosts(): Promise<PostSummary[]> {
  const data = await apiGet<{ items: PostSummary[] }>('/posts?all=true', {
    cache: 'no-store',
  });
  return data.items ?? [];
}

export async function fetchPostBySlug(slug: string): Promise<PostDetail | null> {
  try {
    return await apiGet<PostDetail>(`/posts/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

import { apiGet } from '@/lib/api';

export type TagSummary = { name: string; slug: string };

export type AuthorSummary = {
  id: string;
  username: string;
  nickname: string;
  avatarUrl?: string | null;
};

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt: string;
  tags: TagSummary[];
  author: AuthorSummary;
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
  author: AuthorSummary;
};

export type ReactionSummary = {
  likeCount: number;
  dislikeCount: number;
  myReaction: 'LIKE' | 'DISLIKE' | null;
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

function browserApiBase() {
  if (typeof window !== 'undefined') return '/api/v1';
  return process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';
}

async function reactionFetch(path: string, init?: RequestInit): Promise<ReactionSummary> {
  const res = await fetch(`${browserApiBase()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    let message = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : String(body.message);
      }
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<ReactionSummary>;
}

export async function fetchReactions(slug: string): Promise<ReactionSummary> {
  return reactionFetch(`/posts/${encodeURIComponent(slug)}/reactions`);
}

export async function putReaction(
  slug: string,
  value: 'LIKE' | 'DISLIKE',
): Promise<ReactionSummary> {
  return reactionFetch(`/posts/${encodeURIComponent(slug)}/reactions`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

export async function deleteReaction(slug: string): Promise<ReactionSummary> {
  return reactionFetch(`/posts/${encodeURIComponent(slug)}/reactions`, {
    method: 'DELETE',
  });
}

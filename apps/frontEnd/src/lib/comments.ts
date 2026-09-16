import { ApiError } from '@/lib/api';

export type CommentAuthor = {
  id: string;
  username: string;
  nickname: string;
  avatarUrl?: string | null;
};

export type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  likeCount: number;
  likedByMe: boolean;
  canDelete: boolean;
};

export type CommentListResponse = {
  items: CommentItem[];
  page: number;
  pageSize: number;
  total: number;
};

function browserApiBase() {
  if (typeof window !== 'undefined') return '/api/v1';
  return process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';
}

async function commentFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchComments(
  slug: string,
  page = 1,
  pageSize = 20,
): Promise<CommentListResponse> {
  const q = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return commentFetch(`/posts/${encodeURIComponent(slug)}/comments?${q}`);
}

export async function fetchCommentCount(slug: string): Promise<number> {
  const data = await commentFetch<{ count: number }>(
    `/posts/${encodeURIComponent(slug)}/comments/count`,
  );
  return data.count;
}

export async function createComment(slug: string, content: string): Promise<CommentItem> {
  return commentFetch(`/posts/${encodeURIComponent(slug)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(slug: string, id: string): Promise<void> {
  await commentFetch(`/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function likeComment(
  slug: string,
  id: string,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  return commentFetch(
    `/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(id)}/like`,
    { method: 'PUT' },
  );
}

export async function unlikeComment(
  slug: string,
  id: string,
): Promise<{ likeCount: number; likedByMe: boolean }> {
  return commentFetch(
    `/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(id)}/like`,
    { method: 'DELETE' },
  );
}

export function commentCodePointLength(text: string): number {
  return [...text].length;
}

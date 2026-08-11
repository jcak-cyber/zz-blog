import { ApiError, API_BASE } from '@/lib/api';

export type AuthorPostStatus = 'draft' | 'scheduled' | 'published';

export type AuthorPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: AuthorPostStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string;
  slugLocked?: boolean;
};

export type AuthorPostDetail = AuthorPostSummary & {
  content: string;
  published: boolean;
  createdAt: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  tags: Array<{ name: string; slug: string }>;
};

export type AuthorPostAction = 'draft' | 'publish' | 'schedule' | 'unpublish';

export type AuthorPostInput = {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  tagNames?: string[];
  categoryId?: string | null;
  action?: AuthorPostAction;
  scheduledAt?: string | null;
  confirmSlugChange?: boolean;
};

function browserApiBase() {
  if (typeof window !== 'undefined') return '/api/v1';
  return API_BASE;
}

async function parseError(res: Response): Promise<string> {
  let message = `请求失败 (${res.status})`;
  try {
    const body = await res.json();
    if (body?.message) {
      message = Array.isArray(body.message) ? body.message.join(', ') : String(body.message);
    }
  } catch {
    /* ignore */
  }
  return message;
}

async function refreshAccessCookie(): Promise<boolean> {
  try {
    const res = await fetch(`${browserApiBase()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function authorFetch<T>(
  path: string,
  init?: RequestInit & { emptyResponse?: boolean },
  retried = false,
): Promise<T> {
  const { emptyResponse, ...rest } = init ?? {};
  const res = await fetch(`${browserApiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(rest.body && !(rest.body instanceof FormData)
        ? { 'content-type': 'application/json' }
        : {}),
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (res.status === 401 && !retried) {
    const ok = await refreshAccessCookie();
    if (ok) return authorFetch<T>(path, init, true);
  }

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (emptyResponse || res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function listAuthorPosts(params?: {
  status?: AuthorPostStatus;
  page?: number;
  pageSize?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));
  const qs = q.toString();
  return authorFetch<{
    items: AuthorPostSummary[];
    page: number;
    pageSize: number;
    total: number;
  }>(`/author/posts${qs ? `?${qs}` : ''}`);
}

export async function getAuthorPost(id: string) {
  return authorFetch<AuthorPostDetail>(`/author/posts/${id}`);
}

export async function createAuthorPost(input: AuthorPostInput & { action: AuthorPostAction }) {
  return authorFetch<AuthorPostDetail>('/author/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateAuthorPost(id: string, input: AuthorPostInput) {
  return authorFetch<AuthorPostDetail>(`/author/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteAuthorPost(id: string) {
  return authorFetch<void>(`/author/posts/${id}`, {
    method: 'DELETE',
    emptyResponse: true,
  });
}

export async function listCategories() {
  return authorFetch<Array<{ id: string; name: string; slug: string }>>(
    '/author/posts/meta/categories',
  );
}

export async function uploadCover(file: File) {
  const form = new FormData();
  form.append('file', file);
  return authorFetch<{ id: string; url: string }>('/uploads', {
    method: 'POST',
    body: form,
  });
}

/** 删除本站上传文件（/uploads/...）；外链仅前端清空即可 */
export async function deleteUpload(url: string) {
  return authorFetch<void>('/uploads', {
    method: 'DELETE',
    body: JSON.stringify({ url }),
    emptyResponse: true,
  });
}

export function isLocalUploadUrl(url?: string | null) {
  if (!url) return false;
  try {
    if (url.startsWith('/uploads/')) return true;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return new URL(url).pathname.startsWith('/uploads/');
    }
  } catch {
    return false;
  }
  return false;
}

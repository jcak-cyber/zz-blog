import { ApiError, API_BASE } from '@/lib/api';

export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

/** 浏览器走同域 /api/v1（Next rewrite），便于 Cookie 落在前端域 */
function browserApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
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

async function authFetch<T>(
  path: string,
  init?: RequestInit & { emptyResponse?: boolean },
): Promise<T> {
  const { emptyResponse, ...rest } = init ?? {};
  const res = await fetch(`${browserApiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(rest.body ? { 'content-type': 'application/json' } : {}),
      ...(rest.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (emptyResponse || res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function register(
  username: string,
  password: string,
): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await authFetch<void>('/auth/logout', { method: 'POST', emptyResponse: true });
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    return await authFetch<AuthUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      try {
        const refreshed = await authFetch<{ user: AuthUser }>('/auth/refresh', { method: 'POST' });
        return refreshed.user;
      } catch {
        return null;
      }
    }
    throw error;
  }
}

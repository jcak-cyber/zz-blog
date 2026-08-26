import { ApiError, API_BASE } from '@/lib/api';

export type AuthUser = {
  id: string;
  username: string;
  nickname: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type UpdateProfileInput = {
  nickname?: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

/** 浏览器走同域 /api/v1（Next rewrite），便于 Cookie 落在前端域 */
function browserApiBase() {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return API_BASE;
}

async function parseError(res: Response): Promise<{ message: string; requiresCaptcha: boolean }> {
  let message = `请求失败 (${res.status})`;
  let requiresCaptcha = false;
  try {
    const body = await res.json();
    if (body?.message) {
      message = Array.isArray(body.message) ? body.message.join(', ') : String(body.message);
    }
    requiresCaptcha = Boolean(body?.requiresCaptcha);
  } catch {
    /* ignore */
  }
  return { message, requiresCaptcha };
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
    const { message, requiresCaptcha } = await parseError(res);
    throw new ApiError(message, res.status, requiresCaptcha);
  }

  if (emptyResponse || res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function fetchCaptcha(): Promise<{ captchaId: string; imageSvg: string }> {
  return authFetch<{ captchaId: string; imageSvg: string }>('/auth/captcha');
}

export async function register(
  username: string,
  password: string,
  captchaId: string,
  captchaCode: string,
): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, captchaId, captchaCode }),
  });
}

export async function fetchLoginChallenge(
  username: string,
): Promise<{ requiresCaptcha: boolean; failCount: number }> {
  const q = encodeURIComponent(username.trim());
  return authFetch<{ requiresCaptcha: boolean; failCount: number }>(
    `/auth/login-challenge?username=${q}`,
  );
}

export async function login(
  username: string,
  password: string,
  captcha?: { captchaId: string; captchaCode: string },
): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      ...(captcha
        ? { captchaId: captcha.captchaId, captchaCode: captcha.captchaCode }
        : {}),
    }),
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

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  return authFetch<AuthUser>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function uploadAvatarFile(file: File): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${browserApiBase()}/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: form,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }
  return res.json() as Promise<{ id: string; url: string }>;
}

export async function deleteUploadFile(url: string): Promise<void> {
  await authFetch<void>('/uploads', {
    method: 'DELETE',
    body: JSON.stringify({ url }),
    emptyResponse: true,
  });
}

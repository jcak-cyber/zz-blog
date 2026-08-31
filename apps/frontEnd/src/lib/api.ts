function resolveApiBase(): string {
  // 服务端（SSR / RSC）：走 Docker 内网 backend，避免 localhost 指到前端容器自己
  if (typeof window === 'undefined') {
    const backend = (process.env.BACKEND_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
    return `${backend}/api/v1`;
  }
  // 浏览器：同域 /api/v1，由 Next rewrite 转到后端
  return '/api/v1';
}

/** @deprecated 优先用 resolveApiBase()；保留导出兼容旧引用 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public requiresCaptcha = false,
  ) {
    super(message);
  }
}

type ApiInit = RequestInit & {
  credentialsMode?: RequestCredentials;
};

async function parseErrorMessage(res: Response): Promise<string> {
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

export async function apiGet<T>(path: string, init?: ApiInit): Promise<T> {
  const { credentialsMode, ...rest } = init ?? {};
  const res = await fetch(`${resolveApiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    credentials: credentialsMode,
    headers: {
      accept: 'application/json',
      ...(rest.headers ?? {}),
    },
    next: rest.cache === 'no-store' ? undefined : { revalidate: 30 },
  });

  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res), res.status);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: ApiInit & { emptyResponse?: boolean },
): Promise<T> {
  const { credentialsMode, emptyResponse, ...rest } = init ?? {};
  const res = await fetch(`${resolveApiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
    method: 'POST',
    ...rest,
    credentials: credentialsMode ?? 'include',
    headers: {
      accept: 'application/json',
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(rest.headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : rest.body,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new ApiError(await parseErrorMessage(res), res.status);
  }

  if (emptyResponse || res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export { API_BASE, resolveApiBase };

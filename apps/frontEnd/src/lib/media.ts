const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api/v1';

function mediaOrigin() {
  return API_BASE.replace(/\/api\/v1\/?$/, '');
}

/** 将后端相对路径（如 /uploads/xxx）解析为可访问地址 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return `${mediaOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}

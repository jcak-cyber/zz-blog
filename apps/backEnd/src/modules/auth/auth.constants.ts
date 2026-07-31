export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: '账号或密码不正确',
  UNAUTHORIZED: '未登录或登录已过期',
  FORBIDDEN_ROLE: '账号或密码不正确',
} as const;

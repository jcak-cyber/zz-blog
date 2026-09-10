import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_SECRETS = new Set([
  'change-me-access',
  'change-me-refresh',
  'dev-import-token',
  'zzblog',
]);

/**
 * 生产环境启动前校验，避免带着默认密钥/错误 CORS 上线。
 * 开发环境只打警告，不阻断。
 */
export function assertProductionEnv(config: ConfigService): void {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const logger = new Logger('EnvCheck');
  const problems: string[] = [];
  const warnings: string[] = [];

  const access = config.get<string>('JWT_ACCESS_SECRET')?.trim() ?? '';
  const refresh = config.get<string>('JWT_REFRESH_SECRET')?.trim() ?? '';
  const importToken = config.get<string>('IMPORT_TOKEN')?.trim() ?? '';
  const cors = config.get<string>('CORS_ORIGIN')?.trim() ?? '';
  const databaseUrl = config.get<string>('DATABASE_URL') ?? '';
  const cookieSecure = config.get<string>('COOKIE_SECURE');

  if (!access || DEFAULT_SECRETS.has(access)) {
    problems.push('JWT_ACCESS_SECRET 未设置或仍是默认值 change-me-access');
  }
  if (!refresh || DEFAULT_SECRETS.has(refresh)) {
    problems.push('JWT_REFRESH_SECRET 未设置或仍是默认值 change-me-refresh');
  }
  if (!importToken || DEFAULT_SECRETS.has(importToken)) {
    problems.push('IMPORT_TOKEN 未设置或仍是默认值 dev-import-token');
  }
  if (!cors) {
    problems.push('CORS_ORIGIN 未设置（生产必须显式配置，如 http://IP:3000）');
  }
  if (/:\/\/[^:]+:zzblog@/.test(databaseUrl) || databaseUrl.includes('zzblog:zzblog@')) {
    problems.push('DATABASE_URL 仍使用默认密码 zzblog，请先改库密码并更新 .env');
  }

  if (cookieSecure === 'false') {
    warnings.push('COOKIE_SECURE=false（适合 HTTP/公网 IP；上 HTTPS 后请改为 true）');
  } else if (isProd && cookieSecure !== 'true' && cookieSecure !== 'false') {
    warnings.push('未显式设置 COOKIE_SECURE；生产默认按 Secure Cookie，HTTP 访问会导致无法登录');
  }

  for (const w of warnings) {
    logger.warn(w);
  }

  if (problems.length === 0) {
    if (isProd) logger.log('生产环境变量校验通过');
    return;
  }

  const message = `环境变量不安全或不完整:\n- ${problems.join('\n- ')}`;
  if (isProd) {
    throw new Error(message);
  }
  logger.warn(`${message}\n（当前为 development，仅警告不退出）`);
}

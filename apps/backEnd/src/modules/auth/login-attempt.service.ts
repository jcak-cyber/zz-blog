import { Injectable } from '@nestjs/common';

type AttemptEntry = {
  count: number;
  expiresAt: number;
};

const WINDOW_MS = 30 * 60_000;
/** 失败达到该次数后，后续登录必须带图形验证码 */
export const LOGIN_CAPTCHA_THRESHOLD = 3;

@Injectable()
export class LoginAttemptService {
  private readonly store = new Map<string, AttemptEntry>();

  key(ip: string, username: string): string {
    return `${ip || 'unknown'}::${username.trim().toLowerCase()}`;
  }

  requiresCaptcha(key: string): boolean {
    this.purgeExpired();
    const entry = this.store.get(key);
    return Boolean(entry && entry.count >= LOGIN_CAPTCHA_THRESHOLD);
  }

  failCount(key: string): number {
    this.purgeExpired();
    return this.store.get(key)?.count ?? 0;
  }

  recordFailure(key: string): number {
    this.purgeExpired();
    const prev = this.store.get(key);
    const count = (prev?.count ?? 0) + 1;
    this.store.set(key, { count, expiresAt: Date.now() + WINDOW_MS });
    return count;
  }

  clear(key: string): void {
    this.store.delete(key);
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [id, entry] of this.store) {
      if (entry.expiresAt < now) this.store.delete(id);
    }
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';

type CaptchaEntry = {
  code: string;
  expiresAt: number;
};

const TTL_MS = 5 * 60_000;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const COLORS = ['#6b4cff', '#1f6feb', '#0f8a5f', '#c23b3b', '#b85a38', '#0f5c4a'];

@Injectable()
export class CaptchaService {
  private readonly store = new Map<string, CaptchaEntry>();

  create(): { captchaId: string; imageSvg: string } {
    this.purgeExpired();
    const code = Array.from({ length: 4 }, () => CHARSET[randomInt(CHARSET.length)]).join('');
    const captchaId = randomBytes(16).toString('hex');
    this.store.set(captchaId, { code, expiresAt: Date.now() + TTL_MS });
    return { captchaId, imageSvg: this.renderSvg(code) };
  }

  /** 校验成功后即销毁；失败也销毁并要求换一张 */
  consume(captchaId: string | undefined, input: string | undefined): void {
    if (!captchaId?.trim() || !input?.trim()) {
      throw new BadRequestException('请填写图形验证码');
    }
    const entry = this.store.get(captchaId);
    this.store.delete(captchaId);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new BadRequestException('验证码已失效，请换一张');
    }
    if (entry.code.toLowerCase() !== input.trim().toLowerCase()) {
      throw new BadRequestException('图形验证码错误');
    }
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [id, entry] of this.store) {
      if (entry.expiresAt < now) this.store.delete(id);
    }
  }

  private renderSvg(code: string): string {
    const width = 120;
    const height = 40;
    const chars = code.split('');
    const letters = chars
      .map((ch, i) => {
        const x = 18 + i * 26 + randomInt(-2, 3);
        const y = 26 + randomInt(-3, 4);
        const rot = randomInt(-18, 19);
        const color = COLORS[i % COLORS.length];
        return `<text x="${x}" y="${y}" fill="${color}" font-size="22" font-family="Georgia, serif" font-weight="700" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
      })
      .join('');
    const lines = Array.from({ length: 4 }, () => {
      const x1 = randomInt(0, width);
      const y1 = randomInt(0, height);
      const x2 = randomInt(0, width);
      const y2 = randomInt(0, height);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c5d9d1" stroke-width="1" opacity="0.7"/>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="captcha"><rect width="100%" height="100%" fill="#f7f1e6"/>${lines}${letters}</svg>`;
    return svg;
  }
}

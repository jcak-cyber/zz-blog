import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CookieOptions, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ACCESS_COOKIE,
  AUTH_ERRORS,
  REFRESH_COOKIE,
} from './auth.constants';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';

type RefreshPayload = {
  sub: string;
  type: 'refresh';
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private isProd() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  private parseTtlMs(ttl: string, fallbackMs: number): number {
    const match = /^(\d+)([smhd])$/i.exec(ttl.trim());
    if (!match) return fallbackMs;
    const n = Number(match[1]);
    const unit = match[2].toLowerCase();
    const map: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return n * (map[unit] ?? 60_000);
  }

  private accessTtl() {
    return this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
  }

  private refreshTtl() {
    return this.config.get<string>('JWT_REFRESH_TTL') ?? '7d';
  }

  private cookieBase(maxAgeMs: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProd(),
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  private toUserDto(user: { id: string; email: string; role: Role }): AuthUserDto {
    return { id: user.id, email: user.email, role: user.role };
  }

  private signAccess(user: { id: string; email: string; role: Role }) {
    return this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access' as const,
      },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
        expiresIn: Math.floor(this.parseTtlMs(this.accessTtl(), 15 * 60_000) / 1000),
      },
    );
  }

  private signRefresh(userId: string) {
    return this.jwt.sign(
      { sub: userId, type: 'refresh' as const },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'change-me-refresh',
        expiresIn: Math.floor(this.parseTtlMs(this.refreshTtl(), 7 * 86_400_000) / 1000),
      },
    );
  }

  setAuthCookies(res: Response, user: { id: string; email: string; role: Role }) {
    const access = this.signAccess(user);
    const refresh = this.signRefresh(user.id);
    res.cookie(
      ACCESS_COOKIE,
      access,
      this.cookieBase(this.parseTtlMs(this.accessTtl(), 15 * 60_000)),
    );
    res.cookie(
      REFRESH_COOKIE,
      refresh,
      this.cookieBase(this.parseTtlMs(this.refreshTtl(), 7 * 86_400_000)),
    );
  }

  clearAuthCookies(res: Response) {
    const base: CookieOptions = {
      httpOnly: true,
      secure: this.isProd(),
      sameSite: 'lax',
      path: '/',
    };
    res.clearCookie(ACCESS_COOKIE, base);
    res.clearCookie(REFRESH_COOKIE, base);
  }

  async login(dto: LoginDto, res: Response): Promise<{ user: AuthUserDto }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (user.role !== Role.ADMIN && user.role !== Role.AUTHOR) {
      throw new UnauthorizedException(AUTH_ERRORS.FORBIDDEN_ROLE);
    }

    this.setAuthCookies(res, user);
    return { user: this.toUserDto(user) };
  }

  async refresh(refreshToken: string | undefined, res: Response): Promise<{ user: AuthUserDto }> {
    if (!refreshToken) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    let payload: RefreshPayload;
    try {
      payload = this.jwt.verify<RefreshPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? 'change-me-refresh',
      });
    } catch {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.AUTHOR)) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    this.setAuthCookies(res, user);
    return { user: this.toUserDto(user) };
  }

  logout(res: Response) {
    this.clearAuthCookies(res);
  }
}

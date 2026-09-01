import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CookieOptions, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalStorageAdapter } from '../uploads/local-storage.adapter';
import { ACCESS_COOKIE, AUTH_ERRORS, REFRESH_COOKIE } from './auth.constants';
import { CaptchaService } from './captcha.service';
import { LoginAttemptService, LOGIN_CAPTCHA_THRESHOLD } from './login-attempt.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type RefreshPayload = {
  sub: string;
  type: 'refresh';
};

type UserRow = {
  id: string;
  username: string;
  nickname: string;
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly storage: LocalStorageAdapter,
    private readonly captcha: CaptchaService,
    private readonly loginAttempts: LoginAttemptService,
  ) {}

  private isProd() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }

  /** HTTP（如公网 IP）部署时设 COOKIE_SECURE=false，否则浏览器不存/不发 Cookie */
  private cookieSecure() {
    const explicit = this.config.get<string>('COOKIE_SECURE');
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;
    return this.isProd();
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
      secure: this.cookieSecure(),
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  private toUserDto(user: UserRow): AuthUserDto {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      bio: user.bio ?? null,
    };
  }

  private signAccess(user: { id: string; username: string; role: Role }) {
    return this.jwt.sign(
      {
        sub: user.id,
        username: user.username,
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

  setAuthCookies(res: Response, user: { id: string; username: string; role: Role }) {
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
      secure: this.cookieSecure(),
      sameSite: 'lax',
      path: '/',
    };
    res.clearCookie(ACCESS_COOKIE, base);
    res.clearCookie(REFRESH_COOKIE, base);
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.AUTHOR)) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }
    return this.toUserDto(user);
  }

  private async safeRemoveUpload(url: string | null | undefined) {
    if (!url?.trim()) return;
    try {
      await this.storage.removeByUrl(url);
    } catch {
      /* 尽力删除，失败不阻断资料更新 */
    }
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<AuthUserDto> {
    if (dto.nickname === undefined && dto.avatarUrl === undefined && dto.bio === undefined) {
      throw new BadRequestException('请至少更新一项资料');
    }

    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current || (current.role !== Role.ADMIN && current.role !== Role.AUTHOR)) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.nickname !== undefined) {
      const nickname = dto.nickname.trim();
      if (!nickname) {
        throw new BadRequestException('昵称不能为空');
      }
      data.nickname = nickname;
    }

    if (dto.bio !== undefined) {
      if (dto.bio === null || dto.bio.trim() === '') {
        data.bio = null;
      } else {
        data.bio = dto.bio.trim();
      }
    }

    let oldAvatar: string | null = null;
    if (dto.avatarUrl !== undefined) {
      oldAvatar = current.avatarUrl;
      data.avatarUrl = dto.avatarUrl;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    if (dto.avatarUrl !== undefined && oldAvatar && oldAvatar !== dto.avatarUrl) {
      await this.safeRemoveUpload(oldAvatar);
    }

    return this.toUserDto(updated);
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUserDto }> {
    this.captcha.consume(dto.captchaId, dto.captchaCode);

    const username = dto.username.trim();
    const email = `${username.toLowerCase()}@users.local`;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          nickname: username,
          email,
          passwordHash,
          role: Role.AUTHOR,
        },
      });
      return { user: this.toUserDto(user) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('用户名已被占用');
      }
      throw error;
    }
  }

  loginChallenge(attemptKey: string): { requiresCaptcha: boolean; failCount: number } {
    const failCount = this.loginAttempts.failCount(attemptKey);
    return {
      requiresCaptcha: this.loginAttempts.requiresCaptcha(attemptKey),
      failCount,
    };
  }

  async login(dto: LoginDto, res: Response, attemptKey: string): Promise<{ user: AuthUserDto }> {
    const username = dto.username.trim();
    const needsCaptcha = this.loginAttempts.requiresCaptcha(attemptKey);

    if (needsCaptcha) {
      try {
        this.captcha.consume(dto.captchaId, dto.captchaCode);
      } catch (err) {
        if (err instanceof BadRequestException) {
          const body = err.getResponse();
          const raw =
            typeof body === 'string'
              ? body
              : ((body as { message?: string | string[] }).message ?? '请填写图形验证码');
          throw new BadRequestException({
            message: Array.isArray(raw) ? raw.join(', ') : raw,
            requiresCaptcha: true,
          });
        }
        throw err;
      }
    }

    const fail = (message: string) => {
      const count = this.loginAttempts.recordFailure(attemptKey);
      throw new UnauthorizedException({
        message,
        requiresCaptcha: count >= LOGIN_CAPTCHA_THRESHOLD,
      });
    };

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      fail(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const ok = await bcrypt.compare(dto.password, user!.passwordHash);
    if (!ok) {
      fail(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    if (user!.role !== Role.ADMIN && user!.role !== Role.AUTHOR) {
      fail(AUTH_ERRORS.FORBIDDEN_ROLE);
    }

    this.loginAttempts.clear(attemptKey);
    this.setAuthCookies(res, user!);
    return { user: this.toUserDto(user!) };
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

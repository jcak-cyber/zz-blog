import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { ACCESS_COOKIE, AUTH_ERRORS } from '../../modules/auth/auth.constants';
import { AuthUserDto } from '../../modules/auth/dto/auth-user.dto';

type AccessPayload = {
  sub: string;
  username: string;
  role: Role;
  type: 'access';
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUserDto }>();
    const token = request.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }

    try {
      const payload = this.jwt.verify<AccessPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
      });
      if (payload.type !== 'access') {
        throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
      }
      if (payload.role !== Role.ADMIN && payload.role !== Role.AUTHOR) {
        throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
      }
      request.user = {
        id: payload.sub,
        username: payload.username,
        nickname: payload.username,
        role: payload.role,
        avatarUrl: null,
        bio: null,
      };
      return true;
    } catch {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }
  }
}

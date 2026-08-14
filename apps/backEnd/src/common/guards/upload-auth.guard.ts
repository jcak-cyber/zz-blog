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

/** 允许 JWT（ADMIN|AUTHOR）或 import-token */
@Injectable()
export class UploadAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUserDto }>();

    if (this.tryImportToken(request)) return true;
    if (this.tryJwt(request)) return true;

    throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
  }

  private tryImportToken(request: Request): boolean {
    const header = request.header('x-import-token') ?? request.header('authorization');
    const expected = this.config.get<string>('IMPORT_TOKEN');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : header;
    return Boolean(expected && token === expected);
  }

  private tryJwt(request: Request & { user?: AuthUserDto }): boolean {
    const token = request.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) return false;
    try {
      const payload = this.jwt.verify<AccessPayload>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
      });
      if (payload.type !== 'access') return false;
      if (payload.role !== Role.ADMIN && payload.role !== Role.AUTHOR) return false;
      request.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };
      return true;
    } catch {
      return false;
    }
  }
}

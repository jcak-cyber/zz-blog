import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ImportTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.header('x-import-token') ?? request.header('authorization');
    const expected = this.config.get<string>('IMPORT_TOKEN');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : header;
    if (!expected || token !== expected) {
      throw new UnauthorizedException('无效的导入令牌');
    }
    return true;
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserDto } from '../../modules/auth/dto/auth-user.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserDto | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUserDto }>();
    return request.user;
  },
);

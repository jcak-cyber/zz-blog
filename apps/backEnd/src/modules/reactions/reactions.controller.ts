import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ACCESS_COOKIE } from '../auth/auth.constants';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { UpsertReactionDto } from './dto/upsert-reaction.dto';
import { ReactionsService } from './reactions.service';

@ApiTags('reactions')
@Controller('posts/:slug/reactions')
export class ReactionsController {
  constructor(
    private readonly reactionsService: ReactionsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private optionalUserId(req: Request): string | undefined {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) return undefined;
    try {
      const payload = this.jwt.verify<{
        sub: string;
        role: Role;
        type: string;
      }>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
      });
      if (payload.type !== 'access') return undefined;
      if (payload.role !== Role.ADMIN && payload.role !== Role.AUTHOR) return undefined;
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  @Get()
  @ApiOperation({ summary: '文章表态计数与本人状态' })
  @ApiOkResponse({ description: 'likeCount / dislikeCount / myReaction' })
  get(@Param('slug') slug: string, @Req() req: Request) {
    return this.reactionsService.getBySlug(decodeURIComponent(slug), this.optionalUserId(req));
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '点赞或点踩（互斥）' })
  @ApiUnauthorizedResponse({ description: '未登录' })
  upsert(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUserDto,
    @Body() dto: UpsertReactionDto,
  ) {
    return this.reactionsService.upsert(decodeURIComponent(slug), user.id, dto.value);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '取消表态' })
  remove(@Param('slug') slug: string, @CurrentUser() user: AuthUserDto) {
    return this.reactionsService.remove(decodeURIComponent(slug), user.id);
  }
}

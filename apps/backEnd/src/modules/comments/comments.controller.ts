import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
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
import { CreateCommentDto, ListCommentsQueryDto } from './dto/comment.dto';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('posts/:slug/comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private optionalViewer(req: Request): { id: string; role: Role } | undefined {
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
      return { id: payload.sub, role: payload.role };
    } catch {
      return undefined;
    }
  }

  @Get('count')
  @ApiOperation({ summary: '文章评论数' })
  @ApiOkResponse({ description: '{ count }' })
  count(@Param('slug') slug: string) {
    return this.commentsService.countBySlug(decodeURIComponent(slug));
  }

  @Get()
  @ApiOperation({ summary: '评论列表（较新在前）' })
  list(
    @Param('slug') slug: string,
    @Query() query: ListCommentsQueryDto,
    @Req() req: Request,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return this.commentsService.listBySlug(
      decodeURIComponent(slug),
      page,
      pageSize,
      this.optionalViewer(req),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '发表评论' })
  @ApiUnauthorizedResponse({ description: '未登录' })
  create(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUserDto,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      decodeURIComponent(slug),
      { id: user.id, role: user.role },
      dto.content,
    );
  }

  @Put(':id/like')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '点赞评论' })
  like(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return this.commentsService.like(decodeURIComponent(slug), id, user.id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '取消评论点赞' })
  unlike(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return this.commentsService.unlike(decodeURIComponent(slug), id, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '删除评论（硬删除）' })
  async remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    await this.commentsService.remove(decodeURIComponent(slug), id, {
      id: user.id,
      role: user.role,
    });
  }
}

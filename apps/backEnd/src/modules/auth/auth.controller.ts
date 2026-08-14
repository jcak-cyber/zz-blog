import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AUTH_ERRORS, REFRESH_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: '公众注册（不自动登录）' })
  @ApiCreatedResponse({ description: '注册成功，需再登录' })
  @ApiConflictResponse({ description: '用户名已被占用' })
  async register(@Body() dto: RegisterDto): Promise<{ user: AuthUserDto }> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '用户名密码登录' })
  @ApiOkResponse({ description: '登录成功，写入 HttpOnly Cookie' })
  @ApiUnauthorizedResponse({ description: AUTH_ERRORS.INVALID_CREDENTIALS })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUserDto }> {
    return this.authService.login(dto, res);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: '刷新 Access Cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUserDto }> {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    return this.authService.refresh(token, res);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: '登出并清除 Cookie' })
  logout(@Res({ passthrough: true }) res: Response): void {
    this.authService.logout(res);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '当前登录用户资料' })
  me(@CurrentUser() user: AuthUserDto | undefined): Promise<AuthUserDto> {
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }
    return this.authService.getMe(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '更新本人昵称 / 头像 / 简介' })
  @ApiOkResponse({ description: '更新后的用户资料' })
  updateProfile(
    @CurrentUser() user: AuthUserDto | undefined,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthUserDto> {
    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.UNAUTHORIZED);
    }
    return this.authService.updateProfile(user.id, dto);
  }
}

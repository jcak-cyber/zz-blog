import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LocalStorageAdapter } from '../uploads/local-storage.adapter';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { LoginAttemptService } from './login-attempt.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CaptchaService, LoginAttemptService, JwtAuthGuard, LocalStorageAdapter],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}

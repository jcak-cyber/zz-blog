import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alice', description: '用户名（全站唯一）' })
  @IsString({ message: '请填写用户名' })
  @IsNotEmpty({ message: '请填写用户名' })
  @Matches(/^[a-zA-Z0-9_\u4e00-\u9fff-]{2,32}$/, {
    message: '用户名为 2–32 位字母、数字、下划线、连字符或中文',
  })
  username!: string;

  @ApiProperty({ example: 'password1', minLength: 8 })
  @IsString({ message: '密码格式不正确' })
  @IsNotEmpty({ message: '请填写密码' })
  @MinLength(8, { message: '密码至少 8 个字符' })
  password!: string;

  @ApiProperty({ description: '图形验证码 ID（由 /auth/captcha 下发）' })
  @IsString({ message: '请填写图形验证码' })
  @IsNotEmpty({ message: '请填写图形验证码' })
  captchaId!: string;

  @ApiProperty({ example: 'A3K7', description: '图形验证码内容' })
  @IsString({ message: '请填写图形验证码' })
  @IsNotEmpty({ message: '请填写图形验证码' })
  captchaCode!: string;
}

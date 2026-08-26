import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'author', description: '用户名' })
  @IsString({ message: '请填写用户名' })
  @IsNotEmpty({ message: '请填写用户名' })
  @Matches(/^[a-zA-Z0-9_\u4e00-\u9fff-]{2,32}$/, {
    message: '用户名为 2–32 位字母、数字、下划线、连字符或中文',
  })
  username!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString({ message: '密码格式不正确' })
  @IsNotEmpty({ message: '请填写密码' })
  @MinLength(1, { message: '请填写密码' })
  password!: string;

  @ApiPropertyOptional({ description: '失败满 3 次后必填：验证码 ID' })
  @IsOptional()
  @IsString()
  captchaId?: string;

  @ApiPropertyOptional({ description: '失败满 3 次后必填：验证码内容' })
  @IsOptional()
  @IsString()
  captchaCode?: string;
}

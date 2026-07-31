import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'author@zz.blog', description: '账号（邮箱）' })
  @IsEmail({}, { message: '请输入有效的邮箱账号' })
  @IsNotEmpty({ message: '请填写账号' })
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString({ message: '密码格式不正确' })
  @IsNotEmpty({ message: '请填写密码' })
  @MinLength(1, { message: '请填写密码' })
  password!: string;
}

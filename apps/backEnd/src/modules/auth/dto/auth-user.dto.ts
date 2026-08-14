import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: '登录与展示用用户名' })
  username!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}

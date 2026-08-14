import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: '登录用户名（不可通过资料接口修改）' })
  username!: string;

  @ApiProperty({ description: '展示用昵称（必填）' })
  nickname!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiPropertyOptional({ nullable: true, description: '头像相对路径，如 /uploads/…' })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ nullable: true, description: '个人简介' })
  bio!: string | null;
}

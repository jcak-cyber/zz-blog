import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '阿丽', description: '展示昵称，不可为空' })
  @IsOptional()
  @IsString({ message: '昵称格式不正确' })
  @MinLength(2, { message: '昵称长度为 2–32 个字符' })
  @MaxLength(32, { message: '昵称长度为 2–32 个字符' })
  @Matches(/^[a-zA-Z0-9_\u4e00-\u9fff-]+$/, {
    message: '昵称仅支持字母、数字、下划线、连字符或中文',
  })
  nickname?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: '头像 URL；传 null 表示删除头像',
  })
  @Allow()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString({ message: '头像地址格式不正确' })
  @Matches(/^\/uploads\/[0-9a-f-]{36}\.[a-z0-9]+$/i, {
    message: '头像必须为本站上传路径',
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 500 })
  @Allow()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString({ message: '简介格式不正确' })
  @MaxLength(500, { message: '简介最多 500 字' })
  bio?: string | null;
}

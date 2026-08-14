import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionValue } from '@prisma/client';

export class UpsertReactionDto {
  @ApiProperty({ enum: ReactionValue })
  @IsEnum(ReactionValue, { message: '表态须为 LIKE 或 DISLIKE' })
  value!: ReactionValue;
}

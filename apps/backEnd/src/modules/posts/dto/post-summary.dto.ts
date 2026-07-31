import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagSummaryDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class PostSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  excerpt?: string | null;

  @ApiPropertyOptional()
  coverImageUrl?: string | null;

  @ApiProperty()
  publishedAt!: Date;

  @ApiProperty({ type: [TagSummaryDto] })
  tags!: TagSummaryDto[];
}

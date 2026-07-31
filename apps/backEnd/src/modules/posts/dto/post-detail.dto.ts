import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TagSummaryDto } from './post-summary.dto';

export class CategorySummaryDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class PostDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  excerpt?: string | null;

  @ApiPropertyOptional()
  coverImageUrl?: string | null;

  @ApiProperty()
  publishedAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [TagSummaryDto] })
  tags!: TagSummaryDto[];

  @ApiPropertyOptional({ type: CategorySummaryDto })
  category?: CategorySummaryDto | null;
}

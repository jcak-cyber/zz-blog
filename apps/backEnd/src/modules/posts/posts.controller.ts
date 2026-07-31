import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ImportTokenGuard } from '../../common/guards/import-token.guard';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { CreatePostDto, ImportPostsDto, UpdatePostDto } from './dto/mutate-posts.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  list(@Query() query: ListPostsQueryDto) {
    return this.postsService.listPublished(query);
  }

  @Post('import')
  @UseGuards(ImportTokenGuard)
  @ApiHeader({ name: 'x-import-token' })
  importPosts(@Body() dto: ImportPostsDto) {
    return this.postsService.importItems(dto.items);
  }

  @Post()
  @UseGuards(ImportTokenGuard)
  @ApiHeader({ name: 'x-import-token' })
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.postsService.getPublishedBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(ImportTokenGuard)
  @ApiHeader({ name: 'x-import-token' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(ImportTokenGuard)
  @ApiHeader({ name: 'x-import-token' })
  async remove(@Param('id') id: string) {
    await this.postsService.remove(id);
  }
}

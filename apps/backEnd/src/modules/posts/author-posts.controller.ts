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
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { AuthorPostsService } from './author-posts.service';
import {
  CreateAuthorPostDto,
  ListAuthorPostsQueryDto,
  UpdateAuthorPostDto,
} from './dto/author-posts.dto';

@ApiTags('author-posts')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('author/posts')
export class AuthorPostsController {
  constructor(private readonly authorPostsService: AuthorPostsService) {}

  @Get()
  list(@CurrentUser() user: AuthUserDto, @Query() query: ListAuthorPostsQueryDto) {
    return this.authorPostsService.list(user.id, query);
  }

  @Get('meta/categories')
  categories() {
    return this.authorPostsService.listCategories();
  }

  @Post()
  create(@CurrentUser() user: AuthUserDto, @Body() dto: CreateAuthorPostDto) {
    return this.authorPostsService.create(user.id, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUserDto, @Param('id') id: string) {
    return this.authorPostsService.getById(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserDto,
    @Param('id') id: string,
    @Body() dto: UpdateAuthorPostDto,
  ) {
    return this.authorPostsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUserDto, @Param('id') id: string) {
    await this.authorPostsService.remove(user.id, id);
  }
}

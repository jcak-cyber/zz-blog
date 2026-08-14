import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorPostsController } from './author-posts.controller';
import { AuthorPostsService } from './author-posts.service';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

@Module({
  imports: [AuthModule],
  controllers: [PostsController, AuthorPostsController],
  providers: [PostsService, AuthorPostsService, PostsRepository],
  exports: [PostsService, AuthorPostsService, PostsRepository],
})
export class PostsModule {}


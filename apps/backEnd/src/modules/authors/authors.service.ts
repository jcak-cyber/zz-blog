import { Injectable, NotFoundException } from '@nestjs/common';
import { PostsRepository } from '../posts/posts.repository';

function mapSummary(
  post: Awaited<ReturnType<PostsRepository['findPublishedSummariesByAuthorId']>>[number],
) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt!,
    tags: post.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
    author: {
      id: post.author.id,
      username: post.author.username,
      nickname: post.author.nickname,
      avatarUrl: post.author.avatarUrl,
    },
  };
}

@Injectable()
export class AuthorsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async getPublicByUsername(username: string) {
    const author = await this.postsRepository.findPublicAuthorByUsername(username);
    if (!author) {
      throw new NotFoundException('未找到作者');
    }
    const posts = await this.postsRepository.findPublishedSummariesByAuthorId(author.id);
    return {
      username: author.username,
      nickname: author.nickname,
      avatarUrl: author.avatarUrl,
      bio: author.bio,
      posts: posts.map(mapSummary),
    };
  }
}

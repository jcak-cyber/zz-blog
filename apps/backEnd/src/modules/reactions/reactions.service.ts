import { Injectable, NotFoundException } from '@nestjs/common';
import { ReactionValue } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { publicVisibleWhere } from '../posts/post-visibility';

export type ReactionSummary = {
  likeCount: number;
  dislikeCount: number;
  myReaction: ReactionValue | null;
};

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findPublicPost(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { ...publicVisibleWhere(), slug },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('未找到文章');
    return post;
  }

  private async summarize(postId: string, userId?: string): Promise<ReactionSummary> {
    const [likeCount, dislikeCount, mine] = await Promise.all([
      this.prisma.postReaction.count({ where: { postId, value: ReactionValue.LIKE } }),
      this.prisma.postReaction.count({ where: { postId, value: ReactionValue.DISLIKE } }),
      userId
        ? this.prisma.postReaction.findUnique({
            where: { postId_userId: { postId, userId } },
          })
        : Promise.resolve(null),
    ]);
    return {
      likeCount,
      dislikeCount,
      myReaction: mine?.value ?? null,
    };
  }

  async getBySlug(slug: string, userId?: string) {
    const post = await this.findPublicPost(slug);
    return this.summarize(post.id, userId);
  }

  async upsert(slug: string, userId: string, value: ReactionValue) {
    const post = await this.findPublicPost(slug);
    await this.prisma.postReaction.upsert({
      where: { postId_userId: { postId: post.id, userId } },
      create: { postId: post.id, userId, value },
      update: { value },
    });
    return this.summarize(post.id, userId);
  }

  async remove(slug: string, userId: string) {
    const post = await this.findPublicPost(slug);
    await this.prisma.postReaction.deleteMany({
      where: { postId: post.id, userId },
    });
    return this.summarize(post.id, userId);
  }
}

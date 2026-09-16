import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { publicVisibleWhere } from '../posts/post-visibility';

const MAX_CODEPOINTS = 1000;
const RATE_LIMIT_MS = 30_000;

function codePointLength(text: string): number {
  return [...text].length;
}

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findPublicPost(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { ...publicVisibleWhere(), slug },
      select: { id: true, authorId: true },
    });
    if (!post) throw new NotFoundException('未找到文章');
    return post;
  }

  private canDelete(
    user: { id: string; role: Role } | undefined,
    commentAuthorId: string,
    postAuthorId: string,
  ): boolean {
    if (!user) return false;
    if (user.role === Role.ADMIN) return true;
    if (user.id === commentAuthorId) return true;
    if (user.id === postAuthorId) return true;
    return false;
  }

  private mapItem(
    comment: {
      id: string;
      content: string;
      createdAt: Date;
      authorId: string;
      author: {
        id: string;
        username: string;
        nickname: string;
        avatarUrl: string | null;
      };
      _count: { reactions: number };
      reactions?: { userId: string }[];
    },
    postAuthorId: string,
    viewer?: { id: string; role: Role },
  ) {
    const likedByMe = Boolean(
      viewer && comment.reactions?.some((r) => r.userId === viewer.id),
    );
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        nickname: comment.author.nickname,
        avatarUrl: comment.author.avatarUrl,
      },
      likeCount: comment._count.reactions,
      likedByMe,
      canDelete: this.canDelete(viewer, comment.authorId, postAuthorId),
    };
  }

  async countBySlug(slug: string) {
    const post = await this.findPublicPost(slug);
    const count = await this.prisma.comment.count({
      where: { postId: post.id, parentId: null },
    });
    return { count };
  }

  async listBySlug(
    slug: string,
    page: number,
    pageSize: number,
    viewer?: { id: string; role: Role },
  ) {
    const post = await this.findPublicPost(slug);
    const skip = (page - 1) * pageSize;
    const where = { postId: post.id, parentId: null as string | null };

    const [total, rows] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          author: {
            select: { id: true, username: true, nickname: true, avatarUrl: true },
          },
          _count: { select: { reactions: true } },
          reactions: viewer
            ? { where: { userId: viewer.id }, select: { userId: true } }
            : false,
        },
      }),
    ]);

    return {
      items: rows.map((row) =>
        this.mapItem(
          {
            ...row,
            reactions: Array.isArray(row.reactions) ? row.reactions : [],
          },
          post.authorId,
          viewer,
        ),
      ),
      page,
      pageSize,
      total,
    };
  }

  async create(
    slug: string,
    user: { id: string; role: Role },
    rawContent: string,
  ) {
    const content = rawContent.trim();
    if (!content) {
      throw new BadRequestException('评论不能为空');
    }
    if (codePointLength(content) > MAX_CODEPOINTS) {
      throw new BadRequestException('评论不能超过 1000 个字符');
    }

    const post = await this.findPublicPost(slug);

    const recent = await this.prisma.comment.findFirst({
      where: { postId: post.id, authorId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < RATE_LIMIT_MS) {
      throw new HttpException('请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    }

    const created = await this.prisma.comment.create({
      data: {
        content,
        postId: post.id,
        authorId: user.id,
        parentId: null,
      },
      include: {
        author: {
          select: { id: true, username: true, nickname: true, avatarUrl: true },
        },
        _count: { select: { reactions: true } },
      },
    });

    return this.mapItem({ ...created, reactions: [] }, post.authorId, user);
  }

  async remove(slug: string, commentId: string, user: { id: string; role: Role }) {
    const post = await this.findPublicPost(slug);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId: post.id },
      select: { id: true, authorId: true },
    });
    if (!comment) throw new NotFoundException('未找到评论');
    if (!this.canDelete(user, comment.authorId, post.authorId)) {
      throw new ForbiddenException('无权删除该评论');
    }
    await this.prisma.comment.delete({ where: { id: comment.id } });
  }

  async like(slug: string, commentId: string, userId: string) {
    const post = await this.findPublicPost(slug);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId: post.id, parentId: null },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('未找到评论');

    await this.prisma.commentReaction.upsert({
      where: { commentId_userId: { commentId: comment.id, userId } },
      create: { commentId: comment.id, userId },
      update: {},
    });

    const likeCount = await this.prisma.commentReaction.count({
      where: { commentId: comment.id },
    });
    return { likeCount, likedByMe: true };
  }

  async unlike(slug: string, commentId: string, userId: string) {
    const post = await this.findPublicPost(slug);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, postId: post.id, parentId: null },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('未找到评论');

    await this.prisma.commentReaction.deleteMany({
      where: { commentId: comment.id, userId },
    });

    const likeCount = await this.prisma.commentReaction.count({
      where: { commentId: comment.id },
    });
    return { likeCount, likedByMe: false };
  }
}

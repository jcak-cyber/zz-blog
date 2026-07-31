import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { publicVisibleWhere } from './post-visibility';

const summaryInclude = {
  tags: { include: { tag: true } },
} satisfies Prisma.PostInclude;

const detailInclude = {
  tags: { include: { tag: true } },
  category: true,
} satisfies Prisma.PostInclude;

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllPublishedSummaries() {
    return this.prisma.post.findMany({
      where: publicVisibleWhere(),
      include: summaryInclude,
      orderBy: { publishedAt: 'desc' },
    });
  }

  findPublishedSummariesPaged(skip: number, take: number) {
    return this.prisma.post.findMany({
      where: publicVisibleWhere(),
      include: summaryInclude,
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
    });
  }

  countPublished() {
    return this.prisma.post.count({ where: publicVisibleWhere() });
  }

  findPublishedBySlug(slug: string) {
    return this.prisma.post.findFirst({
      where: { ...publicVisibleWhere(), slug },
      include: detailInclude,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.post.findUnique({ where: { slug } });
  }

  findById(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: detailInclude,
    });
  }

  findAuthorPosts(where: Prisma.PostWhereInput, skip: number, take: number) {
    return this.prisma.post.findMany({
      where,
      include: detailInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    });
  }

  countAuthorPosts(where: Prisma.PostWhereInput) {
    return this.prisma.post.count({ where });
  }

  create(data: Prisma.PostCreateInput) {
    return this.prisma.post.create({ data, include: detailInclude });
  }

  update(id: string, data: Prisma.PostUpdateInput) {
    return this.prisma.post.update({ where: { id }, data, include: detailInclude });
  }

  delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  upsertTag(name: string, slug: string) {
    return this.prisma.tag.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
    });
  }

  setPostTags(postId: string, tagIds: string[]) {
    return this.prisma.$transaction([
      this.prisma.postTag.deleteMany({ where: { postId } }),
      this.prisma.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
        skipDuplicates: true,
      }),
    ]);
  }

  firstAuthor() {
    return this.prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'AUTHOR'] } },
      orderBy: { createdAt: 'asc' },
    });
  }

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PostsRepository } from './posts.repository';
import { deriveAuthorPostStatus } from './author-post-status';
import { isPubliclyVisible } from './post-visibility';
import {
  CreateAuthorPostDto,
  ListAuthorPostsQueryDto,
  UpdateAuthorPostDto,
} from './dto/author-posts.dto';

function slugifyTag(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]+/g, '')
    .slice(0, 80) || 'tag';
}

type PostWithRelations = NonNullable<Awaited<ReturnType<PostsRepository['findById']>>>;

function mapAuthorDetail(post: PostWithRelations) {
  const status = deriveAuthorPostStatus(post);
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    status,
    published: post.published,
    publishedAt: post.publishedAt,
    scheduledAt: post.scheduledAt,
    updatedAt: post.updatedAt,
    createdAt: post.createdAt,
    categoryId: post.categoryId,
    category: post.category
      ? { id: post.category.id, name: post.category.name, slug: post.category.slug }
      : null,
    tags: post.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
    slugLocked: isPubliclyVisible(post),
  };
}

function mapAuthorSummary(post: PostWithRelations) {
  const d = mapAuthorDetail(post);
  const { content: _c, ...rest } = d;
  return rest;
}

@Injectable()
export class AuthorPostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  private assertOwn(post: { authorId: string }, userId: string) {
    if (post.authorId !== userId) {
      throw new ForbiddenException('无权操作此文章');
    }
  }

  private assertPublishable(title: string, content: string, slug: string) {
    if (!title?.trim()) {
      throw new BadRequestException('发布前请填写标题');
    }
    if (!content?.trim()) {
      throw new BadRequestException('发布前请填写正文');
    }
    if (!slug?.trim()) {
      throw new BadRequestException('发布前请填写 slug');
    }
  }

  private resolvePublishFields(
    action: 'draft' | 'publish' | 'schedule' | 'unpublish',
    scheduledAtRaw?: string | null,
  ): {
    published: boolean;
    publishedAt: Date | null;
    scheduledAt: Date | null;
  } {
    const now = new Date();
    if (action === 'draft' || action === 'unpublish') {
      return { published: false, publishedAt: null, scheduledAt: null };
    }
    if (action === 'publish') {
      return { published: true, publishedAt: now, scheduledAt: null };
    }
    // schedule
    if (!scheduledAtRaw) {
      throw new BadRequestException('预约发布须指定 scheduledAt');
    }
    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('预约时间无效');
    }
    if (scheduledAt.getTime() <= now.getTime()) {
      // 已过期视为立即发布
      return { published: true, publishedAt: now, scheduledAt: null };
    }
    return { published: true, publishedAt: scheduledAt, scheduledAt };
  }

  private async ensureUniqueSlug(slug: string, excludeId?: string) {
    const existing = await this.postsRepository.findBySlug(slug);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('slug 已被占用，请更换');
    }
  }

  private async syncTagNames(postId: string, tagNames?: string[]) {
    if (!tagNames) return;
    const tags = await Promise.all(
      tagNames
        .map((n) => n.trim())
        .filter(Boolean)
        .map(async (name) => {
          const slug = slugifyTag(name);
          return this.postsRepository.upsertTag(name, slug);
        }),
    );
    await this.postsRepository.setPostTags(
      postId,
      tags.map((t) => t.id),
    );
  }

  async list(userId: string, query: ListAuthorPostsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const now = new Date();

    let where: Prisma.PostWhereInput = { authorId: userId };
    if (query.status === 'draft') {
      where = { ...where, published: false };
    } else if (query.status === 'scheduled') {
      where = {
        ...where,
        published: true,
        scheduledAt: { gt: now },
      };
    } else if (query.status === 'published') {
      where = {
        ...where,
        published: true,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
      };
    }

    const [rows, total] = await Promise.all([
      this.postsRepository.findAuthorPosts(where, skip, pageSize),
      this.postsRepository.countAuthorPosts(where),
    ]);

    return {
      items: rows.map(mapAuthorSummary),
      page,
      pageSize,
      total,
    };
  }

  async getById(userId: string, id: string) {
    const post = await this.postsRepository.findById(id);
    if (!post) throw new NotFoundException('未找到文章');
    this.assertOwn(post, userId);
    return mapAuthorDetail(post);
  }

  async create(userId: string, dto: CreateAuthorPostDto) {
    const slug = dto.slug.trim();
    if (dto.action !== 'draft') {
      this.assertPublishable(dto.title, dto.content, slug);
    } else if (!slug) {
      throw new BadRequestException('请填写 slug');
    }

    await this.ensureUniqueSlug(slug);
    const fields = this.resolvePublishFields(dto.action, dto.scheduledAt);

    const post = await this.postsRepository.create({
      title: dto.title.trim() || '无标题',
      slug,
      content: dto.content ?? '',
      excerpt: dto.excerpt,
      coverImageUrl: dto.coverImageUrl,
      published: fields.published,
      publishedAt: fields.publishedAt,
      scheduledAt: fields.scheduledAt,
      author: { connect: { id: userId } },
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
    });

    await this.syncTagNames(post.id, dto.tagNames);
    const detail = await this.postsRepository.findById(post.id);
    return mapAuthorDetail(detail!);
  }

  async update(userId: string, id: string, dto: UpdateAuthorPostDto) {
    const current = await this.postsRepository.findById(id);
    if (!current) throw new NotFoundException('未找到文章');
    this.assertOwn(current, userId);

    const nextTitle = dto.title !== undefined ? dto.title : current.title;
    const nextContent = dto.content !== undefined ? dto.content : current.content;
    let nextSlug = dto.slug !== undefined ? dto.slug.trim() : current.slug;

    if (dto.slug !== undefined && dto.slug.trim() !== current.slug) {
      if (isPubliclyVisible(current) && !dto.confirmSlugChange) {
        throw new BadRequestException('文章已公开，修改 slug 须确认（confirmSlugChange）');
      }
      await this.ensureUniqueSlug(nextSlug, id);
    }

    let published = current.published;
    let publishedAt = current.publishedAt;
    let scheduledAt = current.scheduledAt;

    if (dto.action) {
      if (dto.action !== 'draft' && dto.action !== 'unpublish') {
        this.assertPublishable(nextTitle, nextContent, nextSlug);
      }
      const fields = this.resolvePublishFields(
        dto.action,
        dto.scheduledAt !== undefined ? dto.scheduledAt : current.scheduledAt?.toISOString(),
      );
      published = fields.published;
      publishedAt = fields.publishedAt;
      scheduledAt = fields.scheduledAt;
    } else if (dto.scheduledAt !== undefined && published) {
      const fields = this.resolvePublishFields('schedule', dto.scheduledAt);
      published = fields.published;
      publishedAt = fields.publishedAt;
      scheduledAt = fields.scheduledAt;
    }

    await this.postsRepository.update(id, {
      title: dto.title !== undefined ? nextTitle.trim() || '无标题' : undefined,
      slug: dto.slug !== undefined ? nextSlug : undefined,
      content: dto.content,
      excerpt: dto.excerpt === undefined ? undefined : dto.excerpt,
      coverImageUrl: dto.coverImageUrl === undefined ? undefined : dto.coverImageUrl,
      published,
      publishedAt,
      scheduledAt,
      ...(dto.categoryId === undefined
        ? {}
        : dto.categoryId
          ? { category: { connect: { id: dto.categoryId } } }
          : { category: { disconnect: true } }),
    });

    await this.syncTagNames(id, dto.tagNames);
    const detail = await this.postsRepository.findById(id);
    return mapAuthorDetail(detail!);
  }

  async remove(userId: string, id: string) {
    const current = await this.postsRepository.findById(id);
    if (!current) throw new NotFoundException('未找到文章');
    this.assertOwn(current, userId);
    await this.postsRepository.delete(id);
  }

  listCategories() {
    return this.postsRepository.listCategories();
  }
}

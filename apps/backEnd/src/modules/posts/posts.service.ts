import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { toSkipTake } from '../../common/pagination/pagination.dto';
import { ListPostsQueryDto } from './dto/list-posts.query.dto';
import { CreatePostDto, ImportPostItemDto, UpdatePostDto } from './dto/mutate-posts.dto';
import { parseMarkdownDocument } from './markdown/frontmatter';
import { PostsRepository } from './posts.repository';

function mapSummary(post: Awaited<ReturnType<PostsRepository['findAllPublishedSummaries']>>[number]) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt!,
    tags: post.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
    author: { id: post.author.id, username: post.author.username },
  };
}

function mapDetail(
  post: NonNullable<Awaited<ReturnType<PostsRepository['findPublishedBySlug']>>>,
) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt!,
    updatedAt: post.updatedAt,
    tags: post.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
    category: post.category
      ? { name: post.category.name, slug: post.category.slug }
      : null,
    author: { id: post.author.id, username: post.author.username },
  };
}

function assertPublicable(input: {
  published: boolean;
  slug?: string | null;
  publishedAt?: Date | string | null;
}) {
  if (!input.published) return;
  if (!input.slug?.trim()) {
    throw new BadRequestException('已发布文章必须包含 slug');
  }
  if (!input.publishedAt) {
    throw new BadRequestException('已发布文章必须包含 publishedAt');
  }
}

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async listPublished(query: ListPostsQueryDto) {
    if (query.all) {
      const items = await this.postsRepository.findAllPublishedSummaries();
      return { items: items.map(mapSummary) };
    }
    const { skip, take, page, pageSize } = toSkipTake(query);
    const [items, total] = await Promise.all([
      this.postsRepository.findPublishedSummariesPaged(skip, take),
      this.postsRepository.countPublished(),
    ]);
    return {
      items: items.map(mapSummary),
      page,
      pageSize,
      total,
    };
  }

  async getPublishedBySlug(slug: string) {
    const candidates = new Set<string>([slug]);
    try {
      const once = decodeURIComponent(slug);
      candidates.add(once);
      candidates.add(decodeURIComponent(once));
    } catch {
      /* ignore malformed encoding */
    }

    for (const candidate of candidates) {
      const post = await this.postsRepository.findPublishedBySlug(candidate);
      if (post) return mapDetail(post);
    }
    throw new NotFoundException('未找到文章');
  }

  private async resolveAuthorId() {
    const author = await this.postsRepository.firstAuthor();
    if (!author) {
      throw new BadRequestException('请先 seed 作者用户');
    }
    return author.id;
  }

  private async syncTags(postId: string, tagSlugs?: string[]) {
    if (!tagSlugs) return;
    const tags = await Promise.all(
      tagSlugs.map(async (slug) => {
        const name = slug;
        return this.postsRepository.upsertTag(name, slug);
      }),
    );
    await this.postsRepository.setPostTags(
      postId,
      tags.map((t) => t.id),
    );
  }

  async create(dto: CreatePostDto) {
    assertPublicable({
      published: dto.published,
      slug: dto.slug,
      publishedAt: dto.publishedAt ?? null,
    });
    const existing = await this.postsRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException('slug 已存在');
    }
    const authorId = await this.resolveAuthorId();
    const post = await this.postsRepository.create({
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      excerpt: dto.excerpt,
      coverImageUrl: dto.coverImageUrl,
      published: dto.published,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      author: { connect: { id: authorId } },
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
    });
    await this.syncTags(post.id, dto.tagSlugs);
    const detail = await this.postsRepository.findById(post.id);
    return mapDetail(detail!);
  }

  async update(id: string, dto: UpdatePostDto) {
    const current = await this.postsRepository.findById(id);
    if (!current) {
      throw new NotFoundException('未找到文章');
    }
    const published = dto.published ?? current.published;
    const publishedAt =
      dto.publishedAt === undefined
        ? current.publishedAt
        : dto.publishedAt
          ? new Date(dto.publishedAt)
          : null;
    assertPublicable({ published, slug: current.slug, publishedAt });

    await this.postsRepository.update(id, {
      title: dto.title,
      content: dto.content,
      excerpt: dto.excerpt === undefined ? undefined : dto.excerpt,
      coverImageUrl: dto.coverImageUrl === undefined ? undefined : dto.coverImageUrl,
      published: dto.published,
      publishedAt: dto.publishedAt === undefined ? undefined : publishedAt,
      ...(dto.categoryId === undefined
        ? {}
        : dto.categoryId
          ? { category: { connect: { id: dto.categoryId } } }
          : { category: { disconnect: true } }),
    });
    await this.syncTags(id, dto.tagSlugs);
    const detail = await this.postsRepository.findById(id);
    return mapDetail(detail!);
  }

  async remove(id: string) {
    const current = await this.postsRepository.findById(id);
    if (!current) {
      throw new NotFoundException('未找到文章');
    }
    await this.postsRepository.delete(id);
  }

  async importItems(items: ImportPostItemDto[]) {
    const results: Array<{
      slug: string;
      status: 'created' | 'updated' | 'skipped';
      error?: string;
    }> = [];

    for (const item of items) {
      try {
        const normalizedPublished =
          item.published !== undefined
            ? item.published
            : item.draft !== undefined
              ? !item.draft
              : false;

        if (!item.title?.trim() || !item.slug?.trim()) {
          results.push({ slug: item.slug || '(empty)', status: 'skipped', error: '缺少 title/slug' });
          continue;
        }

        if (normalizedPublished && !item.date) {
          results.push({
            slug: item.slug,
            status: 'skipped',
            error: '已发布文章缺少 date',
          });
          continue;
        }

        const authorId = await this.resolveAuthorId();
        const existing = await this.postsRepository.findBySlug(item.slug);
        const data = {
          title: item.title,
          content: item.content,
          excerpt: item.excerpt,
          coverImageUrl: item.cover,
          published: normalizedPublished,
          publishedAt: item.date ? new Date(item.date) : null,
        };

        if (existing) {
          await this.postsRepository.update(existing.id, {
            ...data,
            // 禁止通过导入改写已有 slug（slug 即唯一键）
          });
          await this.syncTags(existing.id, item.tags);
          results.push({ slug: item.slug, status: 'updated' });
        } else {
          const created = await this.postsRepository.create({
            ...data,
            slug: item.slug,
            author: { connect: { id: authorId } },
          });
          await this.syncTags(created.id, item.tags);
          results.push({ slug: item.slug, status: 'created' });
        }
      } catch (error) {
        results.push({
          slug: item.slug,
          status: 'skipped',
          error: error instanceof Error ? error.message : '导入失败',
        });
      }
    }

    return { results };
  }

  async importRawMarkdown(raw: string) {
    const parsed = parseMarkdownDocument(raw);
    return this.importItems([
      {
        title: parsed.title,
        slug: parsed.slug,
        content: parsed.content,
        excerpt: parsed.excerpt,
        cover: parsed.cover,
        published: parsed.published,
        date: parsed.date,
        tags: parsed.tags,
      },
    ]);
  }
}

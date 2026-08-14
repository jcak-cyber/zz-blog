import Image from 'next/image';
import Link from 'next/link';
import type { PostSummary } from '@/lib/posts';
import { resolveMediaUrl } from '@/lib/media';
import { AuthorNameLink } from '@/features/posts/author-name-link';

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function indexLabel(index: number) {
  return String(index + 1).padStart(2, '0');
}

const tones = ['tone-a', 'tone-b', 'tone-c'] as const;

export function PostListItem({
  post,
  priority = false,
  index = 0,
  variant = 'row',
  hideAuthor = false,
}: {
  post: PostSummary;
  priority?: boolean;
  index?: number;
  variant?: 'featured' | 'row' | 'tile' | 'tall' | 'compact';
  /** 紧凑列表可隐藏作者（如作者主页） */
  hideAuthor?: boolean;
}) {
  const cover = resolveMediaUrl(post.coverImageUrl);
  const delayClass =
    index === 0
      ? 'animate-rise-delay-1'
      : index === 1
        ? 'animate-rise-delay-2'
        : index === 2
          ? 'animate-rise-delay-3'
          : 'animate-rise-delay-4';
  const tone = tones[index % tones.length];
  const reverse = variant === 'row' && index % 2 === 0;
  const href = `/posts/${post.slug}`;
  const author =
    !hideAuthor && post.author?.username && (post.author.nickname || post.author.username) ? (
      <AuthorNameLink
        username={post.author.username}
        nickname={post.author.nickname}
        avatarUrl={post.author.avatarUrl}
      />
    ) : null;

  if (variant === 'compact') {
    return (
      <article className={`group animate-rise ${delayClass}`}>
        <div className="post-panel flex gap-4 overflow-hidden p-3 md:gap-5 md:p-3.5">
          <Link
            href={href}
            className={`relative h-[4.75rem] w-[6.5rem] shrink-0 overflow-hidden md:h-[5.5rem] md:w-[7.5rem] ${
              cover ? '' : tone
            }`}
          >
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                sizes="120px"
                className="post-cover object-cover"
                priority={priority}
              />
            ) : (
              <div className="absolute inset-0 flex items-end p-2">
                <span className="font-brush text-2xl text-white/85">{indexLabel(index)}</span>
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--ink-faint)]">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              {author}
              {post.tags?.[0] ? <span>#{post.tags[0].name}</span> : null}
            </div>
            <h2 className="post-title-link font-display mt-1.5 text-lg leading-snug tracking-tight md:text-xl">
              <Link href={href}>{post.title}</Link>
            </h2>
            {post.excerpt ? (
              <p className="mt-1 line-clamp-1 text-sm text-[var(--ink-muted)]">{post.excerpt}</p>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article className={`group relative overflow-x-clip animate-rise ${delayClass}`}>
        <div className="pointer-events-none absolute left-1 -top-8 watermark-index">
          {indexLabel(index)}
        </div>
        <div className="post-panel relative overflow-hidden p-3 md:p-4">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
            <Link
              href={href}
              className={`cover-reveal relative min-h-[240px] overflow-hidden md:min-h-[340px] ${
                cover ? '' : tone
              }`}
            >
              {cover ? (
                <Image
                  src={cover}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="post-cover object-cover"
                  priority={priority}
                />
              ) : (
                <div className="absolute inset-0 flex items-end p-6">
                  <span className="font-brush text-5xl text-white/90 md:text-7xl">记</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-transparent" />
            </Link>

            <div className="flex flex-col justify-center px-1 py-2 md:px-2">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-faint)]">
                <span className="bg-[var(--accent)] px-2 py-0.5 text-xs tracking-widest text-[var(--paper-bright)]">
                  最新
                </span>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                {author}
                {post.tags?.[0] ? <span>#{post.tags[0].name}</span> : null}
              </div>
              <h2 className="post-title-link font-display mt-4 text-3xl leading-[1.15] tracking-tight md:text-5xl">
                <Link href={href}>{post.title}</Link>
              </h2>
              {post.excerpt ? (
                <p className="mt-4 text-base leading-7 text-[var(--ink-muted)] md:text-lg">
                  {post.excerpt}
                </p>
              ) : null}
              <Link
                href={href}
                className="read-cue mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-2)]"
              >
                进入全文
                <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'tall' || variant === 'tile') {
    return (
      <article className={`group h-full animate-rise ${delayClass}`}>
        <div className="post-panel flex h-full flex-col overflow-hidden">
          <Link
            href={href}
            className={`relative overflow-hidden ${
              variant === 'tall' ? 'aspect-[3/4] min-h-[280px]' : 'aspect-[16/11]'
            } ${cover ? '' : tone}`}
          >
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="post-cover object-cover"
                priority={priority}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-brush text-6xl text-white/85">{indexLabel(index)}</span>
              </div>
            )}
            <div className="absolute left-3 top-3 rounded-sm bg-black/45 px-2 py-1 text-xs tracking-wider text-white backdrop-blur-sm">
              {indexLabel(index)}
            </div>
          </Link>
          <div className="flex flex-1 flex-col p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-faint)]">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              {author}
            </div>
            <h2 className="post-title-link font-display mt-2 text-xl leading-snug md:text-2xl">
              <Link href={href}>{post.title}</Link>
            </h2>
            {post.excerpt ? (
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[var(--ink-muted)]">
                {post.excerpt}
              </p>
            ) : null}
            <Link href={href} className="read-cue mt-4 text-sm text-[var(--accent)]">
              阅读 →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`group animate-rise ${delayClass}`}>
      <div
        className={`post-panel grid items-stretch gap-0 overflow-hidden md:grid-cols-2 ${
          reverse ? 'md:[&>div:first-child]:order-2' : ''
        }`}
      >
        <Link
          href={href}
          className={`relative min-h-[200px] overflow-hidden md:min-h-[240px] ${cover ? '' : tone}`}
        >
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="post-cover object-cover"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-end justify-between p-5">
              <span className="font-brush text-5xl text-white/90">{indexLabel(index)}</span>
              <span className="text-xs tracking-[0.2em] text-white/70">ESSAY</span>
            </div>
          )}
        </Link>
        <div className="flex flex-col justify-center p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-faint)]">
            <span className="font-display text-[var(--accent-2)]">{indexLabel(index)}</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {author}
          </div>
          <h2 className="post-title-link font-display mt-3 text-2xl leading-snug md:text-3xl">
            <Link href={href}>{post.title}</Link>
          </h2>
          {post.excerpt ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ink-muted)] md:text-base">
              {post.excerpt}
            </p>
          ) : null}
          <Link href={href} className="read-cue mt-5 text-sm font-medium text-[var(--accent)]">
            继续阅读 →
          </Link>
        </div>
      </div>
    </article>
  );
}

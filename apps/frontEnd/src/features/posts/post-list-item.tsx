import Image from 'next/image';
import Link from 'next/link';
import type { PostSummary } from '@/lib/posts';

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

function resolveMediaUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
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
}: {
  post: PostSummary;
  priority?: boolean;
  index?: number;
  variant?: 'featured' | 'row' | 'tile' | 'tall';
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

  if (variant === 'featured') {
    return (
      <article className={`group relative animate-rise ${delayClass}`}>
        <div className="pointer-events-none absolute -left-2 -top-10 watermark-index md:-left-6">
          {indexLabel(index)}
        </div>
        <Link href={`/posts/${post.slug}`} className="post-panel relative block overflow-hidden p-3 md:p-4">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
            <div
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
            </div>

            <div className="flex flex-col justify-center px-1 py-2 md:px-2">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--ink-faint)]">
                <span className="bg-[var(--accent)] px-2 py-0.5 text-xs tracking-widest text-[var(--paper-bright)]">
                  最新
                </span>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                {post.tags?.[0] ? <span>#{post.tags[0].name}</span> : null}
              </div>
              <h2 className="post-title-link font-display mt-4 text-3xl leading-[1.15] tracking-tight md:text-5xl">
                {post.title}
              </h2>
              {post.excerpt ? (
                <p className="mt-4 text-base leading-7 text-[var(--ink-muted)] md:text-lg">
                  {post.excerpt}
                </p>
              ) : null}
              <span className="read-cue mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-2)]">
                进入全文
                <span aria-hidden>↗</span>
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'tall' || variant === 'tile') {
    return (
      <article className={`group h-full animate-rise ${delayClass}`}>
        <Link href={`/posts/${post.slug}`} className="post-panel flex h-full flex-col overflow-hidden">
          <div
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
          </div>
          <div className="flex flex-1 flex-col p-4 md:p-5">
            <time className="text-xs text-[var(--ink-faint)]" dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            <h2 className="post-title-link font-display mt-2 text-xl leading-snug md:text-2xl">
              {post.title}
            </h2>
            {post.excerpt ? (
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[var(--ink-muted)]">
                {post.excerpt}
              </p>
            ) : null}
            <span className="read-cue mt-4 text-sm text-[var(--accent)]">阅读 →</span>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className={`group animate-rise ${delayClass}`}>
      <Link
        href={`/posts/${post.slug}`}
        className={`post-panel grid items-stretch gap-0 overflow-hidden md:grid-cols-2 ${
          reverse ? 'md:[&>div:first-child]:order-2' : ''
        }`}
      >
        <div className={`relative min-h-[200px] overflow-hidden md:min-h-[240px] ${cover ? '' : tone}`}>
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
        </div>
        <div className="flex flex-col justify-center p-5 md:p-8">
          <div className="flex items-center gap-3 text-sm text-[var(--ink-faint)]">
            <span className="font-display text-[var(--accent-2)]">{indexLabel(index)}</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </div>
          <h2 className="post-title-link font-display mt-3 text-2xl leading-snug md:text-3xl">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--ink-muted)] md:text-base">
              {post.excerpt}
            </p>
          ) : null}
          <span className="read-cue mt-5 text-sm font-medium text-[var(--accent)]">继续阅读 →</span>
        </div>
      </Link>
    </article>
  );
}

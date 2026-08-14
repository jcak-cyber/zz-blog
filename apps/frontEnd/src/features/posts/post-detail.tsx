import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PostDetail } from '@/lib/posts';
import { resolveMediaUrl } from '@/lib/media';
import { PostReactions } from '@/features/posts/post-reactions';

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

export function PostDetailView({ post, content }: { post: PostDetail; content: ReactNode }) {
  const cover = resolveMediaUrl(post.coverImageUrl);

  return (
    <article className="mx-auto max-w-3xl py-10 md:py-16">
      <Link
        href="/"
        className="text-sm text-ink-muted transition hover:text-accent dark:text-zinc-400"
      >
        ← 返回文章列表
      </Link>

      {cover ? (
        <div className="relative mt-8 aspect-[2/1] overflow-hidden rounded-lg bg-accent-soft/30">
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint dark:text-zinc-400">
          <time>{formatDate(post.publishedAt)}</time>
          {post.author?.username ? (
            <span>
              · 作者 <span className="text-[var(--ink-muted)]">{post.author.username}</span>
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight md:text-5xl">
          {post.title}
        </h1>
        {post.tags?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2 text-sm text-ink-muted dark:text-zinc-400">
            {post.tags.map((tag) => (
              <li key={tag.slug}>#{tag.name}</li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="prose-blog mt-10">{content}</div>

      <PostReactions slug={post.slug} />
    </article>
  );
}

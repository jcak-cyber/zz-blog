import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { PostList } from '@/features/posts/post-list';
import { fetchPublicAuthor } from '@/lib/authors';
import { resolveMediaUrl } from '@/lib/media';

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  const author = await fetchPublicAuthor(username);
  if (!author) return { title: '作者未找到' };
  return {
    title: author.nickname || author.username,
    description: author.bio?.slice(0, 120) || `${author.nickname} 的公开手稿`,
  };
}

export default async function PublicAuthorPage({ params }: Props) {
  const username = decodeURIComponent(params.username);
  const author = await fetchPublicAuthor(username);
  if (!author) notFound();

  const avatarSrc = resolveMediaUrl(author.avatarUrl);

  return (
    <div className="pb-28">
      <section className="hero-band animate-rise relative mt-4 overflow-hidden px-6 py-10 md:mt-8 md:px-10 md:py-14">
        <div className="relative z-[1] flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-5">
            <div className="profile-avatar-btn profile-avatar-btn--filled pointer-events-none size-[4.75rem] shrink-0">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="" className="profile-avatar-img" />
              ) : (
                <span className="grid place-items-center text-[#f0d2c4]">
                  <UserRound className="size-8" strokeWidth={1.5} />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs tracking-[0.35em] text-[#f0d2c4]">AUTHOR</p>
              <h1 className="font-brush mt-2 text-4xl md:text-5xl">{author.nickname}</h1>
              <p className="mt-2 text-sm text-[#e7e0d4]/70">@{author.username}</p>
              {author.bio ? (
                <p className="mt-4 max-w-xl whitespace-pre-wrap text-sm leading-7 text-[#e7e0d4]">
                  {author.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-[#e7e0d4]/60">这个人很懒，什么都没有留下…</p>
              )}
            </div>
          </div>
          <Link
            href="/"
            className="text-sm text-[#e7e0d4]/80 underline-offset-4 transition hover:text-[#f7f1e6] hover:underline"
          >
            ← 返回文章列表
          </Link>
        </div>
      </section>

      <section className="pt-10 md:pt-14">
        <div className="mb-6 flex items-baseline justify-between gap-4 px-1">
          <h2 className="font-display text-xl tracking-tight md:text-2xl">公开手稿</h2>
          <p className="text-sm text-[var(--ink-faint)]">{author.posts.length} 篇</p>
        </div>
        {author.posts.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">暂无已发布文章。</p>
        ) : (
          <PostList posts={author.posts} layout="list" hideAuthor />
        )}
      </section>
    </div>
  );
}

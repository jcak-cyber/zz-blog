import Link from 'next/link';
import type { PostSummary } from '@/lib/posts';
import { PostListItem } from './post-list-item';

export function PostList({
  posts,
  layout = 'magazine',
  hideAuthor = false,
  emptyAction = { href: '/login', label: '登录后开始写作' },
}: {
  posts: PostSummary[];
  /** magazine：首页纵向列表；list：紧凑小图列表 */
  layout?: 'magazine' | 'list';
  hideAuthor?: boolean;
  emptyAction?: { href: string; label: string };
}) {
  if (!posts.length) {
    return (
      <div className="border border-dashed border-[var(--line)] bg-[color-mix(in_srgb,var(--paper-bright)_70%,transparent)] px-6 py-20 text-center">
        <h2 className="font-brush text-balance text-4xl">空卷待写</h2>
        <p className="mt-4 text-pretty text-sm text-[var(--ink-muted)]">还没有公开文章。</p>
        <Link
          href={emptyAction.href}
          className="mt-6 inline-flex min-h-11 items-center justify-center text-sm text-[var(--accent)] underline-offset-4 hover:underline"
        >
          {emptyAction.label}
        </Link>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="space-y-3 md:space-y-3.5">
        {posts.map((post, i) => (
          <PostListItem
            key={post.id}
            post={post}
            index={i}
            priority={i < 2}
            variant="compact"
            hideAuthor={hideAuthor}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {posts.map((post, i) => (
        <PostListItem key={post.id} post={post} index={i} priority={i < 2} variant="row" />
      ))}
    </div>
  );
}

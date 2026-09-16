import type { PostSummary } from '@/lib/posts';
import { PostListItem } from './post-list-item';

export function PostList({
  posts,
  layout = 'magazine',
  hideAuthor = false,
}: {
  posts: PostSummary[];
  /** magazine：首页纵向列表；list：紧凑小图列表 */
  layout?: 'magazine' | 'list';
  hideAuthor?: boolean;
}) {
  if (!posts.length) {
    return (
      <div className="animate-rise border border-dashed border-[var(--line)] bg-[color-mix(in_srgb,var(--paper-bright)_70%,transparent)] px-6 py-20 text-center">
        <p className="font-brush text-4xl tracking-tight">空卷待写</p>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          作者完成 Markdown 发布后，文章会出现在这里。
        </p>
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
        <PostListItem
          key={post.id}
          post={post}
          index={i}
          priority={i < 2}
          variant="row"
        />
      ))}
    </div>
  );
}

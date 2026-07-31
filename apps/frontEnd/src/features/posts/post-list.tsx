import type { PostSummary } from '@/lib/posts';
import { PostListItem } from './post-list-item';

export function PostList({ posts }: { posts: PostSummary[] }) {
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

  const [featured, second, ...others] = posts;

  return (
    <div className="space-y-8 md:space-y-10">
      <PostListItem post={featured} index={0} priority variant="featured" />

      {second ? (
        <div className="grid gap-5 md:grid-cols-12 md:gap-6">
          <div className={others.length ? 'md:col-span-5' : 'md:col-span-12'}>
            <PostListItem
              post={second}
              index={1}
              priority
              variant={others.length ? 'tall' : 'row'}
            />
          </div>

          {others.length > 0 ? (
            <div className="grid gap-5 md:col-span-7">
              {others.map((post, i) => (
                <PostListItem
                  key={post.id}
                  post={post}
                  index={i + 2}
                  variant={i === 0 ? 'row' : 'tile'}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

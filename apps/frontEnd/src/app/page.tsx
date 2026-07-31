import type { PostSummary } from '@/lib/posts';
import { PostList } from '@/features/posts/post-list';
import { fetchAllPublishedPosts } from '@/lib/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '文章列表',
  description: '浏览全部已发布文章',
};

export default async function HomePage() {
  let posts: PostSummary[] = [];
  let errorMessage: string | null = null;
  try {
    posts = await fetchAllPublishedPosts();
  } catch {
    errorMessage = '暂时无法加载文章列表，请确认后端服务已启动。';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28">
      <section className="hero-band animate-rise relative mt-4 overflow-hidden px-6 py-10 md:mt-8 md:px-10 md:py-14">
        <div className="relative z-[1] grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#f0d2c4]">
              zz-blog · Field Notes
            </p>
            <h1 className="font-brush mt-4 text-5xl leading-[1.05] md:text-7xl lg:text-8xl">
              写给慢慢读的人
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#e7e0d4]/md:text-lg">
              不是信息流，是一叠摊开的手稿。森绿与暖赭交织，把阅读节奏拉慢一点。
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end lg:text-right">
            <p
              className="font-brush hidden writing-vertical text-3xl tracking-[0.35em] text-[#f0d2c4]/70 lg:block"
              style={{ writingMode: 'vertical-rl' }}
            >
              沉浸·留白·慢读
            </p>
            {posts.length > 0 ? (
              <p className="rounded-sm border border-white/20 bg-white/5 px-4 py-2 text-sm tracking-wide text-[#f6f1e7]">
                本季手稿 <strong className="mx-1 text-lg">{posts.length}</strong> 篇
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="pt-10 md:pt-14">
        {errorMessage ? (
          <p className="border border-red-300/60 bg-red-50/80 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {errorMessage}
          </p>
        ) : (
          <PostList posts={posts} />
        )}
      </section>
    </div>
  );
}

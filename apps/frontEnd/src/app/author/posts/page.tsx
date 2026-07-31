'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostList } from '@/features/author/post-list';
import { fetchMe } from '@/lib/auth';
import { listAuthorPosts, type AuthorPostSummary } from '@/lib/author-posts';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AuthorPostsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AuthorPostSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) {
        router.replace('/login');
        return;
      }
      try {
        const res = await listAuthorPosts({ pageSize: 50 });
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="author-page">
        <p className="author-msg author-msg--error">{error}</p>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="author-page">
        <p className="text-sm text-[var(--ink-faint)]">加载我的文章…</p>
      </div>
    );
  }

  return (
    <div className="author-page">
      <header className="author-page-head">
        <div>
          <p className="author-eyebrow">MY MANUSCRIPTS</p>
          <h1 className="font-brush text-3xl md:text-4xl">我的文章</h1>
        </div>
        <Link href="/author/posts/new" className={cn(buttonVariants({ variant: 'default' }))}>
          写新文章
        </Link>
      </header>
      <PostList items={items} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PostEditor } from '@/features/author/post-editor';
import { fetchMe } from '@/lib/auth';
import { getAuthorPost, type AuthorPostDetail } from '@/lib/author-posts';

export default function EditAuthorPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<AuthorPostDetail | null>(null);
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
        const detail = await getAuthorPost(params.id);
        if (!cancelled) setPost(detail);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, params.id]);

  if (error) {
    return (
      <div className="author-page">
        <p className="author-msg author-msg--error">{error}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="author-page">
        <p className="text-sm text-[var(--ink-faint)]">加载文章…</p>
      </div>
    );
  }

  return (
    <div className="author-page author-page--wide">
      <PostEditor mode="edit" initial={post} />
    </div>
  );
}

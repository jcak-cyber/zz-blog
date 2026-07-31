'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostEditor } from '@/features/author/post-editor';
import { fetchMe } from '@/lib/auth';

export default function NewAuthorPostPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) {
        router.replace('/login');
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="author-page">
        <p className="text-sm text-[var(--ink-faint)]">正在打开编辑器…</p>
      </div>
    );
  }

  return (
    <div className="author-page author-page--wide">
      <PostEditor mode="create" />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostEditor } from '@/features/author/post-editor';
import { useAuth } from '@/features/auth/auth-provider';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';

export default function NewAuthorPostPage() {
  const router = useRouter();
  const { ready, user } = useAuth();
  const { startNavigating } = useNavigationLoading();
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      startNavigating();
      router.replace('/login');
      return;
    }
    setPageReady(true);
  }, [ready, user, router, startNavigating]);

  if (!ready || !user || !pageReady) {
    return null;
  }

  return (
    <div className="author-page author-page--wide">
      <PostEditor mode="create" />
    </div>
  );
}

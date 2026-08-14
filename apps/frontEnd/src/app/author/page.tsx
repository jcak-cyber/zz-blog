'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthorEntry } from '@/features/auth/author-entry';
import { useAuth } from '@/features/auth/auth-provider';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';

export default function AuthorPage() {
  const router = useRouter();
  const { ready, user } = useAuth();
  const { startNavigating } = useNavigationLoading();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      startNavigating();
      router.replace('/login');
    }
  }, [ready, user, router, startNavigating]);

  if (!ready || !user) {
    return null;
  }

  return (
    <div className="py-16 md:py-20">
      <AuthorEntry user={user} />
    </div>
  );
}

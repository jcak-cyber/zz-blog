'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthorEntry } from '@/features/auth/author-entry';
import { fetchMe, type AuthUser } from '@/lib/auth';

export default function AuthorPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) {
        router.replace('/login');
        return;
      }
      setUser(me);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center text-sm text-[var(--ink-faint)]">
        正在进入作者入口…
      </div>
    );
  }

  return (
    <div className="py-16 md:py-20">
      <AuthorEntry user={user} />
    </div>
  );
}

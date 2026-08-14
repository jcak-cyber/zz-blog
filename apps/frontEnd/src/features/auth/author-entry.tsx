'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AuthUser } from '@/lib/auth';
import { logout } from '@/lib/auth';
import { useAuth } from '@/features/auth/auth-provider';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { ProfileNicknameForm } from '@/features/auth/profile-nickname-form';
import { ProfileAvatar } from '@/features/auth/profile-avatar';
import { ProfileBioForm } from '@/features/auth/profile-bio-form';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AuthorEntry({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const { startNavigating } = useNavigationLoading();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogout() {
    setPending(true);
    setError(null);
    try {
      await logout();
      setUser(null);
      startNavigating();
      router.replace('/login');
      router.refresh();
    } catch {
      setError('登出失败，请稍后重试');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid overflow-hidden border border-[var(--line)] md:grid-cols-[0.9fr_1.1fr]">
        <aside className="hero-band relative flex min-h-[180px] flex-col justify-between px-7 py-8 md:min-h-[360px] md:px-9 md:py-10">
          <div className="relative z-[1]">
            <p className="text-xs tracking-[0.35em] text-[#f0d2c4]">AUTHOR ENTRY</p>
            <h1 className="font-brush mt-4 text-4xl md:text-5xl">手稿台</h1>
            <ProfileNicknameForm nickname={user.nickname || user.username} />
            <p className="mt-4 max-w-xs text-sm leading-7 text-[#e7e0d4]">
              已验证身份。可在此撰写、预约发布，或继续编辑草稿。
            </p>
          </div>
        </aside>

        <section className="bg-[color-mix(in_srgb,var(--paper-bright)_88%,transparent)] px-6 py-9 md:px-10 md:py-12">
          <ProfileAvatar user={user} />

          <p className="mt-6 text-xs tracking-[0.28em] text-[var(--ink-faint)]">SIGNED IN</p>
          <h2 className="font-brush mt-2 text-3xl tracking-tight">你已登录</h2>
          <p className="mt-4 text-[var(--ink-muted)]">
            当前账号 <span className="text-[var(--ink)]">{user.username}</span>
            {user.role ? (
              <span className="text-[var(--ink-faint)]"> · {user.role}</span>
            ) : null}
          </p>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-[var(--accent-2)]">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/author/posts" className={cn(buttonVariants({ variant: 'default' }))}>
              我的文章
            </Link>
            <Link href="/author/posts/new" className={cn(buttonVariants({ variant: 'ghost' }))}>
              写新文章
            </Link>
            <Button type="button" variant="link" onClick={onLogout} disabled={pending}>
              {pending ? '正在登出…' : '登出'}
            </Button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm text-[var(--ink-muted)] underline-offset-4 transition hover:text-[var(--accent)] hover:underline"
            >
              返回阅读
            </Link>
          </div>

          <ProfileBioForm bio={user.bio} />
        </section>
      </div>
    </div>
  );
}

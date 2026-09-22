'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/login-form';
import { useAuth } from '@/features/auth/auth-provider';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';

function LoginSkeleton() {
  return (
    <div className="mx-auto max-w-5xl pb-20 pt-4 md:pt-8" aria-busy="true" aria-label="加载登录页">
      <div className="grid min-h-[220px] border border-[var(--line)] md:min-h-[440px] md:grid-cols-2">
        <div className="bg-[var(--paper-deep)]" />
        <div className="space-y-4 px-6 py-9 md:px-10 md:py-12">
          <div className="h-8 w-28 bg-[var(--paper-deep)]" />
          <div className="h-10 bg-[var(--paper-deep)]" />
          <div className="h-10 bg-[var(--paper-deep)]" />
          <div className="h-10 bg-[var(--paper-deep)]" />
        </div>
      </div>
    </div>
  );
}

function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, user } = useAuth();
  const { startNavigating } = useNavigationLoading();

  useEffect(() => {
    if (!ready || !user) return;
    const next = searchParams.get('next');
    startNavigating();
    router.replace(next && next.startsWith('/') ? next : '/author');
  }, [ready, user, router, searchParams, startNavigating]);

  if (!ready || user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl pb-20 pt-4 md:pt-8">
      <div className="grid overflow-hidden border border-[var(--line)] shadow-[0_24px_48px_-36px_rgba(16,23,20,0.45)] md:grid-cols-[0.95fr_1.05fr]">
        <aside className="hero-band relative flex min-h-[220px] flex-col justify-between px-7 py-8 md:min-h-[440px] md:px-9 md:py-10">
          <div className="relative z-raised">
            <p className="text-sm text-[#f0d2c4]">作者入口</p>
            <h1 className="font-brush mt-5 text-balance text-4xl leading-tight md:text-5xl lg:text-6xl">
              手稿室入口
            </h1>
            <p className="mt-4 max-w-sm text-pretty text-sm leading-7 text-[#e7e0d4] md:text-base">
              注册或登录后即可写作发布。读者从首页慢慢读，无需账号。
            </p>
          </div>
          <div className="relative z-raised mt-8 flex items-end justify-between gap-4">
            <p className="text-pretty text-xs leading-6 text-[#e7e0d4]/70">
              森绿与暖赭之间，留一扇给你的门。
            </p>
          </div>
        </aside>

        <section className="post-panel border-0 bg-[color-mix(in_srgb,var(--paper-bright)_90%,transparent)] px-6 py-9 md:px-10 md:py-12">
          <div className="mb-8">
            <h2 className="font-brush text-balance text-3xl">登录</h2>
            <p className="mt-2 text-pretty text-sm text-[var(--ink-muted)]">
              使用用户名与密码进入手稿室。
            </p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-xs text-[var(--ink-faint)]">
            <Link href="/" className="hover:text-[var(--accent)]">
              返回首页阅读
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPanel />
    </Suspense>
  );
}

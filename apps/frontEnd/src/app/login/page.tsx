'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/features/auth/login-form';
import { fetchMe } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await fetchMe();
        if (cancelled) return;
        if (user) {
          router.replace('/author');
          return;
        }
      } catch {
        /* 网络异常时仍展示登录表单 */
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
    <div className="mx-auto max-w-lg py-24 text-center" role="status" aria-live="polite">
        <p className="font-brush text-2xl text-[var(--ink-muted)]">墨迹未干…</p>
        <p className="mt-2 text-sm text-[var(--ink-faint)]">正在确认登录状态</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-rise pb-20 pt-4 md:pt-8">
      <div className="grid overflow-hidden border border-[var(--line)] shadow-[0_24px_48px_-36px_rgba(16,23,20,0.45)] md:grid-cols-[0.95fr_1.05fr]">
        <aside className="hero-band relative flex min-h-[220px] flex-col justify-between px-7 py-8 md:min-h-[440px] md:px-9 md:py-10">
          <div className="relative z-[1]">
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#f0d2c4]">
              zz-blog · Author Gate
            </p>
            <h1 className="font-brush mt-5 text-4xl leading-tight md:text-5xl lg:text-6xl">
              手稿室入口
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#e7e0d4] md:text-base">
              仅作者可入。读者请从首页慢慢读，无需账号。
            </p>
          </div>
          <div className="relative z-[1] mt-8 flex items-end justify-between gap-4">
            <p className="text-xs leading-6 text-[#e7e0d4]/70">
              森绿与暖赭之间，留一扇只给你的门。
            </p>
            <p
              className="hidden writing-vertical font-brush text-2xl tracking-[0.4em] text-[#f0d2c4]/65 md:block"
              style={{ writingMode: 'vertical-rl' }}
              aria-hidden
            >
              沉浸·留白·慢读
            </p>
          </div>
          <span
            className="watermark-index absolute -bottom-6 -right-2 text-[#f6f1e7] opacity-[0.08]"
            aria-hidden
          >
            登
          </span>
        </aside>

        <section className="post-panel border-0 bg-[color-mix(in_srgb,var(--paper-bright)_90%,transparent)] px-6 py-9 backdrop-blur-sm md:px-10 md:py-12">
          <div className="mb-8">
            <p className="text-xs tracking-[0.28em] text-[var(--ink-faint)]">SIGN IN</p>
            <h2 className="font-brush mt-2 text-3xl tracking-tight">作者登录</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              使用预先配置的邮箱账号进入。
            </p>
          </div>
          <LoginForm />
        </section>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { RegisterForm } from '@/features/auth/register-form';

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-5xl pb-20 pt-4 md:pt-8">
      <div className="grid overflow-hidden border border-[var(--line)] shadow-[0_24px_48px_-36px_rgba(16,23,20,0.45)] md:grid-cols-[0.95fr_1.05fr]">
        <aside className="hero-band relative flex min-h-[220px] flex-col justify-between px-7 py-8 md:min-h-[440px] md:px-9 md:py-10">
          <div className="relative z-raised">
            <p className="text-sm text-[#f0d2c4]">加入写作</p>
            <h1 className="font-brush mt-5 text-balance text-4xl leading-tight md:text-5xl">
              开一卷新账
            </h1>
            <p className="mt-4 max-w-sm text-pretty text-sm leading-7 text-[#e7e0d4] md:text-base">
              自助注册，登录后即可撰写与发布属于你的文章。
            </p>
          </div>
        </aside>

        <section className="post-panel border-0 bg-[color-mix(in_srgb,var(--paper-bright)_90%,transparent)] px-6 py-9 md:px-10 md:py-12">
          <div className="mb-8">
            <h2 className="font-brush text-balance text-3xl">注册账号</h2>
            <p className="mt-2 text-pretty text-sm text-[var(--ink-muted)]">完成后请再登录一次。</p>
          </div>
          <RegisterForm />
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

'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { resolveMediaUrl } from '@/lib/media';

const AUTH_PATHS = ['/login', '/register', '/author'];

export function SiteNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const onAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const avatarSrc = resolveMediaUrl(user?.avatarUrl);

  return (
    <nav className="site-nav" aria-label="站点导航">
      <span className="site-nav-tagline">墨色 · 慢读</span>
      <span className="site-nav-rule" aria-hidden />
      {onAuthPage ? (
        <Link href="/" className="site-nav-author">
          返回阅读
        </Link>
      ) : user ? (
        <Link href="/author" className="site-nav-author">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" className="site-nav-avatar" />
          ) : (
            <span className="site-nav-avatar site-nav-avatar--empty" aria-hidden>
              <UserRound className="size-3.5" strokeWidth={1.75} />
            </span>
          )}
          <span>手稿室</span>
          {user.nickname || user.username ? (
            <span className="text-[var(--ink-faint)]">@{user.nickname || user.username}</span>
          ) : null}
        </Link>
      ) : (
        <span className="flex items-center gap-4">
          <Link href="/register" className="site-nav-author">
            注册
          </Link>
          <Link href="/login" className="site-nav-author">
            登录
          </Link>
        </span>
      )}
    </nav>
  );
}

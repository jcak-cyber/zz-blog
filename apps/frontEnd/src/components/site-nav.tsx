'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';

const AUTH_PATHS = ['/login', '/register', '/author'];

export function SiteNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const onAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

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
          手稿室
          {user.username ? (
            <span className="ml-2 text-[var(--ink-faint)]">@{user.username}</span>
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

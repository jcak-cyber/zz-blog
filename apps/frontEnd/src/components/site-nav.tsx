'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AUTH_PATHS = ['/login', '/author'];

export function SiteNav() {
  const pathname = usePathname();
  const onAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <nav className="site-nav" aria-label="站点导航">
      <span className="site-nav-tagline">墨色 · 慢读</span>
      <span className="site-nav-rule" aria-hidden />
      {onAuthPage ? (
        <Link href="/" className="site-nav-author">
          返回阅读
        </Link>
      ) : (
        <Link href="/login" className="site-nav-author">
          作者入口
        </Link>
      )}
    </nav>
  );
}

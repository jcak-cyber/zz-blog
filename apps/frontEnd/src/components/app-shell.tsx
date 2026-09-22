'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteNav } from '@/components/site-nav';
import { cn } from '@/lib/utils';

function isAuthorWorkspace(pathname: string) {
  return pathname === '/author' || pathname.startsWith('/author/');
}

function isAuthorDesk(pathname: string) {
  return pathname === '/author/posts/new' || /^\/author\/posts\/[^/]+\/edit$/.test(pathname);
}

function SiteBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn('site-brand', compact && 'site-brand--compact')}
      aria-label="zz-blog 首页"
    >
      <span className="site-brand-vert" aria-hidden>
        慢讀
      </span>
      <span className="site-brand-word" aria-hidden>
        <span className="site-brand-ink" />
        <span className="site-brand-main">zz-blog</span>
        <span className="site-brand-sub">field notes</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const workspace = isAuthorWorkspace(pathname);
  const desk = isAuthorDesk(pathname);

  if (desk) {
    return (
      <div className="site-shell site-shell--desk">
        <a href="#main" className="skip-link">
          跳到正文
        </a>
        <header className="site-header mx-auto flex w-full items-center justify-between gap-4 py-3">
          <SiteBrand compact />
          <SiteNav />
        </header>
        <main id="main" className="site-main--desk">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={cn('site-shell', workspace && 'site-shell--author')}>
      <a href="#main" className="skip-link">
        跳到正文
      </a>
      <div className="site-frame">
        <header className="site-header flex w-full items-center justify-between gap-4 pb-3">
          <SiteBrand />
          <SiteNav />
        </header>
        <main id="main">{children}</main>
        {!workspace ? (
          <footer className="py-16 text-sm text-[var(--ink-faint)]">
            © {new Date().getFullYear()} zz-blog · 写给慢慢读的人
          </footer>
        ) : null}
      </div>
    </div>
  );
}

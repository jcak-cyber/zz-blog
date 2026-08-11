'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteNav } from '@/components/site-nav';
import { cn } from '@/lib/utils';

function isAuthorWorkspace(pathname: string) {
  return pathname === '/author' || pathname.startsWith('/author/');
}

function isAuthorDesk(pathname: string) {
  return pathname === '/author/posts/new' || /^\/author\/posts\/[^/]+\/edit$/.test(pathname);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const workspace = isAuthorWorkspace(pathname);
  const desk = isAuthorDesk(pathname);

  if (desk) {
    return (
      <div className="site-shell site-shell--desk">
        <header className="site-header mx-auto flex w-full items-center justify-between gap-4 py-3">
          <a
            href="/"
            className="font-brush text-2xl tracking-tight transition-colors hover:text-[var(--accent)]"
          >
            zz-blog
          </a>
          <SiteNav />
        </header>
        <main className="site-main--desk">{children}</main>
      </div>
    );
  }

  return (
    <div className={cn('site-shell', workspace && 'site-shell--author')}>
      <div className="site-frame">
        <header className="site-header flex w-full items-center justify-between gap-4 pb-3 pt-8">
          <a
            href="/"
            className="font-brush text-3xl tracking-tight transition-colors hover:text-[var(--accent)]"
          >
            zz-blog
          </a>
          <SiteNav />
        </header>
        <main>{children}</main>
        {!workspace ? (
          <footer className="py-16 text-sm text-[var(--ink-faint)]">
            © {new Date().getFullYear()} zz-blog · 写给慢慢读的人
          </footer>
        ) : null}
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteNav } from '@/components/site-nav';
import { cn } from '@/lib/utils';

function isAuthorWorkspace(pathname: string) {
  return pathname === '/author' || pathname.startsWith('/author/');
}

function isAuthorDesk(pathname: string) {
  return (
    pathname === '/author/posts/new' ||
    /^\/author\/posts\/[^/]+\/edit$/.test(pathname)
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const workspace = isAuthorWorkspace(pathname);
  const desk = isAuthorDesk(pathname);

  return (
    <div
      className={cn(
        'site-shell',
        desk && 'site-shell--desk',
        workspace && !desk && 'site-shell--author',
      )}
    >
      <header
        className={cn(
          'site-header mx-auto flex w-full items-center justify-between gap-4 px-4',
          desk ? 'max-w-[1400px] py-3' : 'max-w-6xl pb-3 pt-8',
        )}
      >
        <a
          href="/"
          className={cn(
            'font-brush tracking-tight transition-colors hover:text-[var(--accent)]',
            desk ? 'text-2xl' : 'text-3xl',
          )}
        >
          zz-blog
        </a>
        <SiteNav />
      </header>
      <main className={cn(desk && 'site-main--desk')}>{children}</main>
      {!workspace ? (
        <footer className="mx-auto max-w-6xl px-4 py-16 text-sm text-[var(--ink-faint)]">
          © {new Date().getFullYear()} zz-blog · 写给慢慢读的人
        </footer>
      ) : null}
    </div>
  );
}

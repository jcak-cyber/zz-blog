import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { AppShell } from '@/components/app-shell';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'zz-blog',
    template: '%s · zz-blog',
  },
  description: '极简、高性能的个人博客',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="bg-atmosphere" aria-hidden>
            <div className="bg-grid" />
            <div className="bg-blob-warm" />
            <span className="orb orb-1" />
            <span className="orb orb-2" />
            <span className="orb orb-3" />
            <div className="veil" />
          </div>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

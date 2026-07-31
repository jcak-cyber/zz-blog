import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '作者工作台',
  robots: { index: false, follow: false },
};

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  return children;
}

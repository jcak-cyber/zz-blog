import Link from 'next/link';

export default function PostNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl">未找到文章</h1>
      <p className="mt-3 text-ink-muted dark:text-zinc-400">
        这篇文章不存在，或尚未发布。
      </p>
      <Link href="/" className="mt-8 inline-block text-accent underline underline-offset-4">
        返回首页
      </Link>
    </div>
  );
}

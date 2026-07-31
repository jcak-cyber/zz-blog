'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { deleteAuthorPost, type AuthorPostSummary } from '@/lib/author-posts';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<AuthorPostSummary['status'], string> = {
  draft: '草稿',
  scheduled: '预约中',
  published: '已发布',
};

type Props = {
  items: AuthorPostSummary[];
};

export function PostList({ items: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [target, setTarget] = useState<AuthorPostSummary | null>(null);

  async function confirmDelete() {
    if (!target) return;
    setPendingId(target.id);
    setError(null);
    try {
      await deleteAuthorPost(target.id);
      setItems((list) => list.filter((p) => p.id !== target.id));
      setTarget(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '删除失败');
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="author-empty">
        <p>还没有文章。</p>
        <Link href="/author/posts/new" className={cn(buttonVariants({ variant: 'default' }))}>
          写第一篇
        </Link>
      </div>
    );
  }

  return (
    <div className="author-list">
      {error ? (
        <p className="author-msg author-msg--error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="author-list-ul">
        {items.map((post) => (
          <li key={post.id} className="author-list-item">
            <div>
              <span className={`author-status author-status--${post.status}`}>
                {STATUS_LABEL[post.status]}
              </span>
              <h2 className="author-list-title">
                <Link href={`/author/posts/${post.id}/edit`}>{post.title || '无标题'}</Link>
              </h2>
              <p className="author-list-meta">
                /{post.slug}
                {post.scheduledAt
                  ? ` · 预约 ${new Date(post.scheduledAt).toLocaleString('zh-CN')}`
                  : ''}
                {` · 更新 ${new Date(post.updatedAt).toLocaleString('zh-CN')}`}
              </p>
            </div>
            <div className="author-list-actions">
              <Link
                href={`/author/posts/${post.id}/edit`}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                编辑
              </Link>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pendingId === post.id}
                onClick={() => setTarget(post)}
              >
                删除
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title="删除文章"
        description={
          target?.status === 'draft'
            ? `确定删除草稿「${target?.title || '无标题'}」吗？`
            : `确定删除「${target?.title || '无标题'}」吗？删除后公众将无法访问。`
        }
        confirmLabel="确认删除"
        destructive
        pending={Boolean(target && pendingId === target.id)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

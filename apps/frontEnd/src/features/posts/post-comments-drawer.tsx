'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Trash2, X } from 'lucide-react';
import { PostCommentComposer } from '@/features/posts/post-comment-composer';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { resolveMediaUrl } from '@/lib/media';
import {
  createComment,
  deleteComment,
  fetchComments,
  likeComment,
  unlikeComment,
  type CommentItem,
} from '@/lib/comments';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

type Props = {
  slug: string;
  open: boolean;
  commentCount: number;
  onClose: () => void;
  onCountChange: (count: number) => void;
};

function formatCommentDate(value: string) {
  try {
    const d = new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  } catch {
    return value;
  }
}

export function PostCommentsDrawer({ slug, open, commentCount, onClose, onCountChange }: Props) {
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(commentCount);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  const requireLogin = useCallback(() => {
    startNavigating();
    router.push(`/login?next=${encodeURIComponent(`/posts/${slug}`)}`);
  }, [router, slug, startNavigating]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchComments(slug, 1, 50);
      setItems(res.items);
      setTotal(res.total);
      onCountChange(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载评论失败');
    } finally {
      setLoading(false);
    }
  }, [slug, onCountChange]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEntered(true));
      });
      return () => window.cancelAnimationFrame(id);
    }
    setEntered(false);
    const timer = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function onCreate(content: string) {
    setComposerError(null);
    setPending(true);
    try {
      const item = await createComment(slug, content);
      setItems((prev) => [item, ...prev]);
      const next = total + 1;
      setTotal(next);
      onCountChange(next);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 401) {
        requireLogin();
        return;
      }
      setComposerError(err instanceof Error ? err.message : '发表失败');
      throw err;
    } finally {
      setPending(false);
    }
  }

  async function onToggleLike(item: CommentItem) {
    setError(null);
    try {
      const next = item.likedByMe
        ? await unlikeComment(slug, item.id)
        : await likeComment(slug, item.id);
      setItems((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, likeCount: next.likeCount, likedByMe: next.likedByMe } : c,
        ),
      );
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 401) {
        requireLogin();
        return;
      }
      setError(err instanceof Error ? err.message : '点赞失败');
    }
  }

  async function onDelete(item: CommentItem) {
    if (!item.canDelete) return;
    if (!window.confirm('确定删除这条评论？删除后不可恢复。')) return;
    setError(null);
    try {
      await deleteComment(slug, item.id);
      setItems((prev) => prev.filter((c) => c.id !== item.id));
      const next = Math.max(0, total - 1);
      setTotal(next);
      onCountChange(next);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 401) {
        requireLogin();
        return;
      }
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  if (!mounted) return null;

  return (
    <div
      className={cn('post-comments-root', entered && 'post-comments-root--open')}
      role="dialog"
      aria-modal="true"
      aria-label="评论"
    >
      <div className="post-comments-backdrop" aria-hidden />
      <aside className="post-comments-drawer">
        <header className="post-comments-header">
          <h2 className="post-comments-title">
            评论 <span className="tabular-nums">{total}</span>
          </h2>
          <button type="button" className="post-comments-close" aria-label="关闭" onClick={onClose}>
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <PostCommentComposer
          pending={pending}
          error={composerError}
          onSubmit={onCreate}
          onRequireLogin={requireLogin}
        />

        <div className="post-comments-list">
          {loading ? (
            <div className="space-y-4 px-4 py-5" aria-busy="true" aria-label="评论加载中">
              <div className="h-4 w-1/3 bg-[var(--paper-deep)]" />
              <div className="h-16 bg-[var(--paper-deep)]" />
              <div className="h-4 w-1/4 bg-[var(--paper-deep)]" />
              <div className="h-16 bg-[var(--paper-deep)]" />
            </div>
          ) : null}
          {!loading && items.length === 0 ? (
            <p className="post-comments-empty">还没有评论，来写下第一条吧</p>
          ) : null}
          {items.map((item) => {
            const avatar = resolveMediaUrl(item.author.avatarUrl);
            const name = item.author.nickname || item.author.username;
            return (
              <article key={item.id} className="post-comment-item">
                <div className="post-comment-avatar" aria-hidden>
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="post-comment-avatar-fallback">{name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="post-comment-body">
                  <div className="post-comment-meta">
                    <span className="post-comment-name">{name}</span>
                    <time className="post-comment-date" dateTime={item.createdAt}>
                      {formatCommentDate(item.createdAt)}
                    </time>
                    <div className="post-comment-item-actions">
                      {item.canDelete ? (
                        <button
                          type="button"
                          className="post-comment-tool-btn"
                          aria-label="删除评论"
                          onClick={() => void onDelete(item)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={cn(
                          'post-comment-like',
                          item.likedByMe && 'post-comment-like--active',
                        )}
                        aria-pressed={item.likedByMe}
                        aria-label="点赞评论"
                        onClick={() => void onToggleLike(item)}
                      >
                        <ThumbsUp className="size-3.5" aria-hidden />
                        <span className="tabular-nums">{item.likeCount}</span>
                      </button>
                    </div>
                  </div>
                  <p className="post-comment-content">{item.content}</p>
                </div>
              </article>
            );
          })}
          {error ? (
            <p className="post-comment-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

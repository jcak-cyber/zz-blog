'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  deleteReaction,
  fetchReactions,
  putReaction,
  type ReactionSummary,
} from '@/lib/posts';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { cn } from '@/lib/utils';

type Props = { slug: string };

export function PostReactions({ slug }: Props) {
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();
  const [data, setData] = useState<ReactionSummary | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchReactions(slug)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData({ likeCount: 0, dislikeCount: 0, myReaction: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function onToggle(value: 'LIKE' | 'DISLIKE') {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const next =
        data?.myReaction === value
          ? await deleteReaction(slug)
          : await putReaction(slug, value);
      setData(next);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        startNavigating();
        router.push(`/login?next=${encodeURIComponent(`/posts/${slug}`)}`);
        return;
      }
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setPending(false);
    }
  }

  const likeCount = data?.likeCount ?? 0;
  const dislikeCount = data?.dislikeCount ?? 0;

  return (
    <div className="post-reactions">
      <div className="post-reactions-row">
        <button
          type="button"
          className={cn(
            'post-reaction-btn',
            data?.myReaction === 'LIKE' && 'post-reaction-btn--active',
          )}
          disabled={pending}
          aria-pressed={data?.myReaction === 'LIKE'}
          aria-label="点赞"
          onClick={() => void onToggle('LIKE')}
        >
          <ThumbsUp className="size-4" aria-hidden />
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          className={cn(
            'post-reaction-btn',
            data?.myReaction === 'DISLIKE' && 'post-reaction-btn--active',
          )}
          disabled={pending}
          aria-pressed={data?.myReaction === 'DISLIKE'}
          aria-label="点踩"
          onClick={() => void onToggle('DISLIKE')}
        >
          <ThumbsDown className="size-4" aria-hidden />
          <span>{dislikeCount}</span>
        </button>
      </div>
      {error ? (
        <p role="alert" className="post-reactions-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

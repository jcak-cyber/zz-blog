'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ImageIcon, Smile } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { resolveMediaUrl } from '@/lib/media';
import { commentCodePointLength } from '@/lib/comments';
import { cn } from '@/lib/utils';

const MAX_CHARS = 1000;

type Props = {
  pending?: boolean;
  error?: string | null;
  onSubmit: (content: string) => Promise<void> | void;
  onRequireLogin: () => void;
};

export function PostCommentComposer({ pending, error, onSubmit, onRequireLogin }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [imageHint, setImageHint] = useState(false);

  const remaining = useMemo(() => MAX_CHARS - commentCodePointLength(text), [text]);
  const avatar = resolveMediaUrl(user?.avatarUrl);

  async function handleSubmit() {
    setLocalError(null);
    setImageHint(false);
    if (!user) {
      onRequireLogin();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      setLocalError('评论不能为空');
      return;
    }
    if (commentCodePointLength(trimmed) > MAX_CHARS) {
      setLocalError('评论不能超过 1000 个字符');
      return;
    }
    try {
      await onSubmit(trimmed);
      setText('');
    } catch {
      /* 错误由上层展示，保留输入 */
    }
  }

  return (
    <div className="post-comment-composer">
      <div className="post-comment-composer-row">
        <div className="post-comment-avatar" aria-hidden>
          {avatar ? (
            <Image src={avatar} alt="" width={40} height={40} className="size-full object-cover" />
          ) : (
            <span className="post-comment-avatar-fallback">
              {(user?.nickname || user?.username || '?').slice(0, 1)}
            </span>
          )}
        </div>
        <div className="post-comment-composer-main">
          <textarea
            className="post-comment-input"
            rows={3}
            maxLength={MAX_CHARS * 2}
            placeholder="说说你的看法，或者提个问题"
            value={text}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value;
              if (commentCodePointLength(next) <= MAX_CHARS) setText(next);
              else setText([...next].slice(0, MAX_CHARS).join(''));
            }}
            onFocus={() => {
              if (!user) onRequireLogin();
            }}
          />
          <div className="post-comment-composer-footer">
            <p className="post-comment-remaining">还能输入{Math.max(0, remaining)}个字符</p>
            <div className="post-comment-composer-actions">
              <button
                type="button"
                className="post-comment-tool-btn"
                aria-label="表情"
                title="可直接输入表情字符"
                onClick={() => setLocalError('可直接使用输入法输入表情')}
              >
                <Smile className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                className="post-comment-tool-btn"
                aria-label="图片"
                onClick={() => {
                  setImageHint(true);
                  setLocalError(null);
                }}
              >
                <ImageIcon className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                className={cn('post-comment-submit', pending && 'opacity-60')}
                disabled={pending}
                onClick={() => void handleSubmit()}
              >
                评论
              </button>
            </div>
          </div>
          {imageHint ? (
            <p className="post-comment-hint" role="status">
              图片评论后续开放，请先发表文字
            </p>
          ) : null}
          {localError || error ? (
            <p className="post-comment-error" role="alert">
              {localError || error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

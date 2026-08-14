'use client';

import { useRef, useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import {
  deleteUploadFile,
  updateProfile,
  uploadAvatarFile,
  type AuthUser,
} from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/media';
import { useAuth } from '@/features/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

type Props = { user: AuthUser };

export function ProfileAvatar({ user }: Props) {
  const { setUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarSrc = resolveMediaUrl(user.avatarUrl);

  async function onPick(file: File | null) {
    if (!file) return;
    setError(null);
    if (!ALLOWED.has(file.type)) {
      setError('请上传 JPEG、PNG 或 WebP 图片');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('头像不能超过 2MB');
      return;
    }

    setPending(true);
    try {
      const stored = await uploadAvatarFile(file);
      const next = await updateProfile({ avatarUrl: stored.url });
      setUser(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    if (!user.avatarUrl) return;
    setError(null);
    setPending(true);
    const prev = user.avatarUrl;
    try {
      const next = await updateProfile({ avatarUrl: null });
      setUser(next);
      try {
        await deleteUploadFile(prev);
      } catch {
        /* 服务端已尽力删；前端再尝试一次 */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="profile-avatar-block">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={cn('profile-avatar-btn', avatarSrc && 'profile-avatar-btn--filled')}
          disabled={pending}
          aria-label={avatarSrc ? '更换头像' : '上传头像'}
          onClick={() => inputRef.current?.click()}
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" className="profile-avatar-img" />
          ) : (
            <span className="profile-avatar-mark" aria-hidden>
              <UserRound className="profile-avatar-mark-user" strokeWidth={1.5} />
              <span className="profile-avatar-mark-badge">
                <Camera className="size-3" strokeWidth={2} />
              </span>
            </span>
          )}
        </button>
        <div className="min-w-0">
          <p className="text-sm text-[var(--ink)]">{avatarSrc ? '更换头像' : '上传头像'}</p>
          <p className="mt-1 text-xs text-[var(--ink-faint)]">JPEG / PNG / WebP，不超过 2MB</p>
          {avatarSrc ? (
            <Button
              type="button"
              variant="link"
              className="mt-1 h-auto px-0"
              disabled={pending}
              onClick={() => void onRemove()}
            >
              删除头像
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
      />
      {error ? (
        <p role="alert" className="mt-2 text-sm text-[var(--accent-2)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

type Props = {
  username: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  className?: string;
  /** 列表用 `@昵称`；详情可用无前缀 */
  withAt?: boolean;
  /** 是否显示头像，默认 true */
  showAvatar?: boolean;
};

export function AuthorNameLink({
  username,
  nickname,
  avatarUrl,
  className,
  withAt = true,
  showAvatar = true,
}: Props) {
  const label = (nickname || username).trim();
  if (!username || !label) return null;
  const src = resolveMediaUrl(avatarUrl);

  return (
    <Link
      href={`/u/${encodeURIComponent(username)}`}
      className={cn(
        'relative z-[2] inline-flex items-center gap-1.5 transition hover:text-[var(--accent)]',
        className,
      )}
    >
      {showAvatar ? (
        <span className="author-chip-avatar" aria-hidden>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" />
          ) : (
            <UserRound className="size-2.5" strokeWidth={1.75} />
          )}
        </span>
      ) : null}
      <span className="hover:underline hover:underline-offset-4">
        {withAt ? `@${label}` : label}
      </span>
    </Link>
  );
}

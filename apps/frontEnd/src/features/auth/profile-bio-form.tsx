'use client';

import { FormEvent, useState } from 'react';
import { updateProfile } from '@/lib/auth';
import { useAuth } from '@/features/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const MAX_BIO = 500;
const PLACEHOLDER = '这个人很懒，什么都没有留下…';

type Props = { bio?: string | null };

export function ProfileBioForm({ bio }: Props) {
  const { setUser } = useAuth();
  const [value, setValue] = useState(bio ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (value.length > MAX_BIO) {
      setError(`简介最多 ${MAX_BIO} 字`);
      return;
    }
    setPending(true);
    try {
      const user = await updateProfile({ bio: value.trim() ? value.trim() : null });
      setUser(user);
      setValue(user.bio ?? '');
      setOk('简介已保存');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="profile-bio mt-8 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <Label htmlFor="profile-bio" className="font-normal text-[var(--ink-muted)]">
          个人简介
        </Label>
        <span className="text-xs text-[var(--ink-faint)]">
          {value.length}/{MAX_BIO}
        </span>
      </div>
      <textarea
        id="profile-bio"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={4}
        maxLength={MAX_BIO + 20}
        className="profile-bio-input"
        disabled={pending}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? '保存中…' : '保存简介'}
        </Button>
        {ok ? <span className="text-sm text-[var(--accent)]">{ok}</span> : null}
        {error ? (
          <span role="alert" className="text-sm text-[var(--accent-2)]">
            {error}
          </span>
        ) : null}
      </div>
    </form>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import { Pencil } from 'lucide-react';
import { updateProfile } from '@/lib/auth';
import { useAuth } from '@/features/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  nickname: string;
};

export function ProfileNicknameForm({ nickname }: Props) {
  const { setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(nickname);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const next = value.trim();
    if (!next) {
      setError('昵称不能为空');
      return;
    }
    if (next.length < 2 || next.length > 32) {
      setError('昵称长度为 2–32 个字符');
      return;
    }
    setPending(true);
    try {
      const user = await updateProfile({ nickname: next });
      setUser(user);
      setValue(user.nickname);
      setEditing(false);
      setOk('昵称已更新');
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-5">
        <p className="text-xs tracking-[0.18em] text-[#f0d2c4]">昵称</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-base font-medium tracking-wide text-[#f7f1e6]">{nickname}</p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm border border-[color-mix(in_srgb,#f0d2c4_55%,transparent)] bg-[color-mix(in_srgb,#f7f1e6_12%,transparent)] px-2.5 py-1 text-xs tracking-wide text-[#f0d2c4] transition hover:border-[#f0d2c4] hover:bg-[color-mix(in_srgb,#f7f1e6_20%,transparent)] hover:text-[#f7f1e6]"
            onClick={() => {
              setValue(nickname);
              setError(null);
              setOk(null);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
            修改昵称
          </button>
        </div>
        {ok ? <p className="mt-2 text-xs text-[#c5d9d1]">{ok}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-2">
      <Label htmlFor="profile-nickname" className="text-[#e7e0d4]">
        修改昵称
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="profile-nickname"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={32}
          className="h-9 max-w-[14rem] rounded-sm bg-[color-mix(in_srgb,#fff_12%,transparent)] text-[#f7f1e6]"
          disabled={pending}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? '保存中…' : '保存'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
          取消
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-[#f0d2c4]">
          {error}
        </p>
      ) : null}
    </form>
  );
}

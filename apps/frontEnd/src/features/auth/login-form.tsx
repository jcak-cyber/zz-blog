'use client';

import { FormEvent, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { login } from '@/lib/auth';
import { useAuth } from '@/features/auth/auth-provider';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function mapLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    const raw = err.message || '';
    if (err.status === 429 || /throttl|too many requests|频繁/i.test(raw)) {
      return '尝试过于频繁，请稍后再试';
    }
    if (err.status >= 500 || /failed to fetch|network|econnrefused/i.test(raw)) {
      return '暂时无法登录，请稍后重试';
    }
    if (err.status === 400) {
      return raw || '请检查用户名与密码是否填写正确';
    }
    if (err.status === 401) {
      return raw || '账号或密码不正确';
    }
    return raw || '账号或密码不正确';
  }
  return '暂时无法登录，请稍后重试';
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { startNavigating } = useNavigationLoading();
  const errorId = useId();
  const [username, setUsername] = useState(() => searchParams.get('username')?.trim() ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const registered = searchParams.get('registered') === '1';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('请填写用户名和密码');
      return;
    }

    setPending(true);
    try {
      const { user } = await login(username.trim(), password);
      setUser(user);
      const next = searchParams.get('next');
      startNavigating();
      router.replace(next && next.startsWith('/') ? next : '/author');
      router.refresh();
    } catch (err) {
      setError(mapLoginError(err));
    } finally {
      setPending(false);
    }
  }

  const invalid = Boolean(error);

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
      aria-busy={pending}
      aria-describedby={error ? errorId : undefined}
    >
      {registered ? (
        <p
          role="status"
          className="border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-2 text-sm text-[var(--accent)]"
        >
          注册成功，请使用新账号登录。
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="login-username" className="font-normal text-[var(--ink-muted)]">
          用户名
        </Label>
        <Input
          id="login-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="你的用户名"
          aria-required="true"
          aria-invalid={invalid}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3',
            invalid && 'border-destructive',
          )}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="login-password" className="font-normal text-[var(--ink-muted)]">
            密码
          </Label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="text-xs tracking-wide text-[var(--ink-faint)] transition hover:text-[var(--accent)]"
          >
            {showPassword ? '隐藏密码' : '显示密码'}
          </button>
        </div>
        <Input
          id="login-password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-required="true"
          aria-invalid={invalid}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3',
            invalid && 'border-destructive',
          )}
        />
      </div>

      <div
        id={errorId}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={cn(
          'min-h-[2.5rem]',
          error
            ? 'border border-[color-mix(in_srgb,var(--accent-2)_40%,var(--line))] bg-[color-mix(in_srgb,var(--accent-2)_10%,transparent)] px-3 py-2 text-sm text-[var(--accent-2)]'
            : 'sr-only',
        )}
      >
        {error ?? ''}
      </div>

      <Button type="submit" disabled={pending} className="h-10 w-full tracking-wide" size="lg">
        {pending ? '登录中…' : '进入手稿室'}
      </Button>

      <p className="text-center text-sm text-[var(--ink-muted)]">
        还没有账号？{' '}
        <Link href="/register" className="text-[var(--accent)] underline-offset-4 hover:underline">
          前往注册
        </Link>
      </p>
    </form>
  );
}

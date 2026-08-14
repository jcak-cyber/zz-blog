'use client';

import { FormEvent, Suspense, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { register } from '@/lib/auth';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function mapRegisterError(err: unknown): string {
  if (err instanceof ApiError) {
    const raw = err.message || '';
    if (err.status === 429) return '尝试过于频繁，请稍后再试';
    if (err.status === 409) return raw || '用户名已被占用';
    if (err.status === 400) return raw || '请检查用户名与密码';
    if (err.status >= 500 || /failed to fetch|network/i.test(raw)) {
      return '暂时无法注册，请稍后重试';
    }
    return raw || '注册失败，请重试';
  }
  return '暂时无法注册，请稍后重试';
}

function RegisterFormInner() {
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();
  const errorId = useId();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = username.trim();
    if (!name || !password) {
      setError('请填写用户名和密码');
      return;
    }
    if (password.length < 8) {
      setError('密码至少 8 个字符');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }

    setPending(true);
    try {
      await register(name, password);
      startNavigating();
      router.replace(`/login?registered=1&username=${encodeURIComponent(name)}`);
    } catch (err) {
      setError(mapRegisterError(err));
    } finally {
      setPending(false);
    }
  }

  const invalid = Boolean(error);

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate aria-busy={pending}>
      <div className="space-y-1.5">
        <Label htmlFor="reg-username" className="font-normal text-[var(--ink-muted)]">
          用户名
        </Label>
        <Input
          id="reg-username"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="2–32 位字母、数字或中文"
          aria-invalid={invalid}
          className="h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="reg-password" className="font-normal text-[var(--ink-muted)]">
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
          id="reg-password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少 8 个字符"
          className="h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
        />
        <p className="text-xs text-[var(--ink-faint)]">密码至少 8 位，注册后需再登录一次。</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="reg-confirm" className="font-normal text-[var(--ink-muted)]">
            确认密码
          </Label>
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-pressed={showConfirm}
            aria-label={showConfirm ? '隐藏确认密码' : '显示确认密码'}
            className="text-xs tracking-wide text-[var(--ink-faint)] transition hover:text-[var(--accent)]"
          >
            {showConfirm ? '隐藏密码' : '显示密码'}
          </button>
        </div>
        <Input
          id="reg-confirm"
          name="confirm"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
        />
      </div>

      <div
        id={errorId}
        role="alert"
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
        {pending ? '注册中…' : '创建账号'}
      </Button>

      <p className="text-center text-sm text-[var(--ink-muted)]">
        已有账号？{' '}
        <Link href="/login" className="text-[var(--accent)] underline-offset-4 hover:underline">
          去登录
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--ink-muted)]">加载中…</p>}>
      <RegisterFormInner />
    </Suspense>
  );
}

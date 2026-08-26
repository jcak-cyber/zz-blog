'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { fetchCaptcha, fetchLoginChallenge, login } from '@/lib/auth';
import { useAuth } from '@/features/auth/auth-provider';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FieldErrors = Partial<Record<'username' | 'password' | 'captcha' | 'form', string>>;

function FieldHint({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-[var(--accent-2)]">
      {message}
    </p>
  );
}

function mapLoginError(err: unknown): FieldErrors {
  if (!(err instanceof ApiError)) {
    return { form: '暂时无法登录，请稍后重试' };
  }
  const raw = err.message || '';
  if (err.status === 429 || /throttl|too many requests|频繁/i.test(raw)) {
    return { form: '尝试过于频繁，请稍后再试' };
  }
  if (err.status >= 500 || /failed to fetch|network|econnrefused/i.test(raw)) {
    return { form: '暂时无法登录，请稍后重试' };
  }
  if (/验证码/.test(raw)) return { captcha: raw };
  if (err.status === 400) return { form: raw || '请检查用户名与密码是否填写正确' };
  if (err.status === 401) return { form: raw || '账号或密码不正确' };
  return { form: raw || '账号或密码不正确' };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { startNavigating } = useNavigationLoading();
  const [username, setUsername] = useState(() => searchParams.get('username')?.trim() ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const registered = searchParams.get('registered') === '1';

  const clearFieldError = useCallback((key: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const data = await fetchCaptcha();
      setCaptchaId(data.captchaId);
      setCaptchaSvg(data.imageSvg);
      setCaptchaCode('');
      clearFieldError('captcha');
    } catch {
      setErrors((prev) => ({ ...prev, captcha: '验证码加载失败，请点击换一张' }));
    } finally {
      setCaptchaLoading(false);
    }
  }, [clearFieldError]);

  const refreshChallenge = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        setRequiresCaptcha(false);
        return;
      }
      try {
        const challenge = await fetchLoginChallenge(name);
        setRequiresCaptcha(challenge.requiresCaptcha);
        if (challenge.requiresCaptcha) {
          await loadCaptcha();
        }
      } catch {
        /* 挑战查询失败不阻断登录 */
      }
    },
    [loadCaptcha],
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshChallenge(username);
    }, 400);
    return () => window.clearTimeout(t);
  }, [username, refreshChallenge]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!username.trim()) next.username = '请填写用户名';
    if (!password) next.password = '请填写密码';
    if (requiresCaptcha && !captchaCode.trim()) next.captcha = '请填写图形验证码';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const { user } = await login(
        username.trim(),
        password,
        requiresCaptcha
          ? { captchaId, captchaCode: captchaCode.trim() }
          : undefined,
      );
      setUser(user);
      const dest = searchParams.get('next');
      startNavigating();
      router.replace(dest && dest.startsWith('/') ? dest : '/author');
      router.refresh();
    } catch (err) {
      const mapped = mapLoginError(err);
      setErrors(mapped);
      if (err instanceof ApiError && err.requiresCaptcha) {
        setRequiresCaptcha(true);
        void loadCaptcha();
      } else if (requiresCaptcha) {
        void loadCaptcha();
      }
    } finally {
      setPending(false);
    }
  }

  const captchaDataUrl = captchaSvg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(captchaSvg)}`
    : '';

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate aria-busy={pending}>
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
          onChange={(e) => {
            setUsername(e.target.value);
            clearFieldError('username');
          }}
          placeholder="你的用户名"
          aria-invalid={Boolean(errors.username)}
          className={cn(
            'h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3',
            errors.username && 'border-destructive',
          )}
        />
        <FieldHint message={errors.username} />
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
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          aria-invalid={Boolean(errors.password)}
          className={cn(
            'h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3',
            errors.password && 'border-destructive',
          )}
        />
        <FieldHint message={errors.password} />
      </div>

      {requiresCaptcha ? (
        <div className="space-y-1.5">
          <Label htmlFor="login-captcha" className="font-normal text-[var(--ink-muted)]">
            图形验证码
          </Label>
          <div className="flex flex-wrap items-center gap-2.5">
            <Input
              id="login-captcha"
              name="captcha"
              autoComplete="off"
              required
              value={captchaCode}
              onChange={(e) => {
                setCaptchaCode(e.target.value);
                clearFieldError('captcha');
              }}
              placeholder="请输入图形验证码"
              aria-invalid={Boolean(errors.captcha)}
              className="h-10 min-w-[8rem] flex-1 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
            />
            <button
              type="button"
              onClick={() => void loadCaptcha()}
              disabled={captchaLoading}
              className="h-10 shrink-0 overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--paper-bright)]"
              aria-label="点击刷新验证码"
            >
              {captchaDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={captchaDataUrl}
                  alt="图形验证码"
                  width={120}
                  height={40}
                  className="block h-10 w-[7.5rem]"
                />
              ) : (
                <span className="inline-flex h-10 w-[7.5rem] items-center justify-center text-xs text-[var(--ink-faint)]">
                  {captchaLoading ? '加载中…' : '暂无'}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => void loadCaptcha()}
              disabled={captchaLoading}
              className="inline-flex shrink-0 items-center gap-1 text-xs tracking-wide text-[var(--ink-faint)] transition hover:text-[var(--accent)] disabled:opacity-50"
            >
              <RefreshCw className={cn('size-3.5', captchaLoading && 'animate-spin')} aria-hidden />
              换一张
            </button>
          </div>
          <FieldHint message={errors.captcha} />
        </div>
      ) : null}

      {errors.form ? (
        <p role="alert" className="text-sm text-[var(--accent-2)]">
          {errors.form}
        </p>
      ) : null}

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

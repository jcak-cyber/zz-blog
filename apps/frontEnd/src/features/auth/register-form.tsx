'use client';

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { fetchCaptcha, register } from '@/lib/auth';
import { useNavigationLoading } from '@/features/navigation/navigation-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FieldKey = 'username' | 'password' | 'confirm' | 'captcha';
type FieldErrors = Partial<Record<FieldKey | 'form', string>>;

function FieldHint({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-[var(--accent-2)]">
      {message}
    </p>
  );
}

function mapServerError(err: unknown): FieldErrors {
  if (!(err instanceof ApiError)) {
    return { form: '暂时无法注册，请稍后重试' };
  }
  const raw = err.message || '';
  if (err.status === 429) return { form: '尝试过于频繁，请稍后再试' };
  if (err.status === 409) return { username: raw || '用户名已被占用' };
  if (err.status >= 500 || /failed to fetch|network/i.test(raw)) {
    return { form: '暂时无法注册，请稍后重试' };
  }
  if (/验证码/.test(raw)) return { captcha: raw };
  if (/用户名/.test(raw)) return { username: raw };
  if (/密码/.test(raw)) return { password: raw };
  if (err.status === 400) return { form: raw || '请检查填写内容' };
  return { form: raw || '注册失败，请重试' };
}

function RegisterFormInner() {
  const router = useRouter();
  const { startNavigating } = useNavigationLoading();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const clearFieldError = useCallback((key: FieldKey | 'form') => {
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

  useEffect(() => {
    void loadCaptcha();
  }, [loadCaptcha]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const name = username.trim();
    if (!name) next.username = '请填写用户名';
    if (!password) next.password = '请填写密码';
    else if (password.length < 8) next.password = '密码至少 8 个字符';
    if (!confirm) next.confirm = '请再次输入密码';
    else if (password && confirm !== password) next.confirm = '两次输入的密码不一致';
    if (!captchaCode.trim()) next.captcha = '请填写图形验证码';
    else if (!captchaId) next.captcha = '验证码未就绪，请换一张';
    return next;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    setPending(true);
    try {
      await register(username.trim(), password, captchaId, captchaCode.trim());
      startNavigating();
      router.replace(`/login?registered=1&username=${encodeURIComponent(username.trim())}`);
    } catch (err) {
      setErrors(mapServerError(err));
      void loadCaptcha();
    } finally {
      setPending(false);
    }
  }

  const captchaDataUrl = captchaSvg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(captchaSvg)}`
    : '';

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
          onChange={(e) => {
            setUsername(e.target.value);
            clearFieldError('username');
          }}
          placeholder="2–32 位字母、数字或中文"
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? 'reg-username-err' : undefined}
          className="h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
        />
        <FieldHint id="reg-username-err" message={errors.username} />
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
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          placeholder="至少 8 个字符"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'reg-password-err' : undefined}
          className="h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
        />
        {errors.password ? (
          <FieldHint id="reg-password-err" message={errors.password} />
        ) : (
          <p className="text-xs text-[var(--ink-faint)]">密码至少 8 位，注册后需再登录一次。</p>
        )}
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
          onChange={(e) => {
            setConfirm(e.target.value);
            clearFieldError('confirm');
          }}
          placeholder="请再次输入密码"
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? 'reg-confirm-err' : undefined}
          className="h-10 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
        />
        <FieldHint id="reg-confirm-err" message={errors.confirm} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-captcha" className="font-normal text-[var(--ink-muted)]">
          图形验证码
        </Label>
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            id="reg-captcha"
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
            aria-describedby={errors.captcha ? 'reg-captcha-err' : undefined}
            className="h-10 min-w-[8rem] flex-1 rounded-sm bg-[color-mix(in_srgb,var(--paper)_55%,transparent)] px-3"
          />
          <button
            type="button"
            onClick={() => void loadCaptcha()}
            disabled={captchaLoading}
            className="h-10 shrink-0 overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--paper-bright)]"
            aria-label="点击刷新验证码"
            title="点击图片也可刷新"
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
        <FieldHint id="reg-captcha-err" message={errors.captcha} />
      </div>

      {errors.form ? (
        <p role="alert" className="text-sm text-[var(--accent-2)]">
          {errors.form}
        </p>
      ) : null}

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

'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingOverlay } from '@/components/loading-overlay';

type NavigationContextValue = {
  navigating: boolean;
  /** 编程式跳转（router.push/replace）前调用 */
  startNavigating: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

function normalizePath(pathname: string, search: string) {
  return `${pathname}${search}`;
}

function isInternalNav(anchor: HTMLAnchorElement): string | null {
  if (anchor.target && anchor.target !== '_self') return null;
  if (anchor.hasAttribute('download')) return null;
  if (anchor.getAttribute('rel')?.includes('external')) return null;

  const raw = anchor.getAttribute('href');
  if (!raw || raw.startsWith('#')) return null;
  if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;

  const next = normalizePath(url.pathname, url.search);
  const current = normalizePath(window.location.pathname, window.location.search);
  if (next === current) return null;

  return next;
}

function NavigationProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startNavigating = useCallback(() => {
    setNavigating(true);
    clearTimer();
    // 兜底：避免异常情况下遮罩一直挡住
    timerRef.current = setTimeout(() => setNavigating(false), 10_000);
  }, [clearTimer]);

  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';

  useEffect(() => {
    setNavigating(false);
    clearTimer();
  }, [pathname, search, clearTimer]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNav(anchor)) return;

      startNavigating();
    };

    const onPopState = () => startNavigating();

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      clearTimer();
    };
  }, [startNavigating, clearTimer]);

  const value = useMemo(
    () => ({ navigating, startNavigating }),
    [navigating, startNavigating],
  );

  return (
    <NavigationContext.Provider value={value}>
      {navigating ? <LoadingOverlay /> : null}
      {children}
    </NavigationContext.Provider>
  );
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavigationProviderInner>{children}</NavigationProviderInner>
    </Suspense>
  );
}

export function useNavigationLoading() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigationLoading must be used within NavigationProvider');
  }
  return ctx;
}

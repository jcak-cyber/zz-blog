'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LoadingOverlay } from '@/components/loading-overlay';
import { fetchMe, type AuthUser } from '@/lib/auth';

type AuthContextValue = {
  /** false 时全局 gate 挡住交互 */
  ready: boolean;
  user: AuthUser | null;
  refresh: () => Promise<AuthUser | null>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      ready,
      user,
      refresh,
      setUser,
    }),
    [ready, user, refresh],
  );

  return (
    <AuthContext.Provider value={value}>
      {!ready ? <LoadingOverlay /> : null}
      <div
        className="auth-gate-content"
        aria-hidden={!ready}
        style={
          ready
            ? undefined
            : { pointerEvents: 'none', userSelect: 'none', visibility: 'hidden' }
        }
      >
        {children}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

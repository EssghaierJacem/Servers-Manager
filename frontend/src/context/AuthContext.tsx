import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient, configureApiClient } from '../lib/apiClient';
import type { AuthenticatedUser, TokenPair } from '../lib/types';

const REFRESH_TOKEN_STORAGE_KEY = 'icc.refresh_token';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessTokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // The access token lives only in memory (component state/refs) - never
    // localStorage - to keep it out of reach of an XSS-read of storage. The
    // refresh token is longer-lived and only ever sent to /auth/refresh, so
    // it's persisted (localStorage) specifically so a login survives a page
    // reload; this is the one deliberate exception to "no localStorage".
    configureApiClient({
      getAccessToken: () => accessTokenRef.current,
      getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
      setAccessToken: (token: string) => {
        accessTokenRef.current = token;
      },
      onAuthExpired: () => {
        accessTokenRef.current = null;
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        setUser(null);
      },
    });
  }, []);

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!storedRefreshToken) {
      setIsInitializing(false);
      return;
    }

    apiClient
      .post<{ access_token: string }>(
        '/auth/refresh',
        { refresh_token: storedRefreshToken },
        { skipAuth: true },
      )
      .then(async ({ access_token }) => {
        accessTokenRef.current = access_token;
        const me = await apiClient.get<AuthenticatedUser>('/auth/me');
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const tokens = await apiClient.post<TokenPair>(
      '/auth/login',
      { email, password },
      { skipAuth: true },
    );
    accessTokenRef.current = tokens.access_token;
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token);
    const me = await apiClient.get<AuthenticatedUser>('/auth/me');
    setUser(me);
  };

  const register = async (
    email: string,
    password: string,
    organizationName: string,
  ): Promise<void> => {
    await apiClient.post(
      '/auth/register',
      { email, password, organizationName },
      { skipAuth: true },
    );
    await login(email, password);
  };

  const logout = (): void => {
    accessTokenRef.current = null;
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    setUser(null);
  };

  // login/register/logout only close over refs and setters (never render-scoped
  // state), so they're safe to omit from the dependency array.
  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isInitializing, login, register, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isInitializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

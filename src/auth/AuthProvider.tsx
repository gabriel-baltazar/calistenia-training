import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { env, type AuthMode } from '../config/env';
import { useToast } from '../components/ui/Toast';
import { createAuthService } from './createAuthService';
import { AuthError, type AuthService, type AuthUser } from './types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
export type AuthPending = 'password' | 'google' | null;

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  mode: AuthMode;
  /** Erro do boot (init do Firebase ou resultado do redirect do Google), exibido no Login. */
  initialError: AuthError | null;
  /** Ação de login em andamento: os dois botões do Login ficam desabilitados. */
  pending: AuthPending;
  /** true depois de um signOut() pedido pelo usuário (ProtectedRoute omite o `from`); volta a false ao entrar. */
  signedOutByUser: boolean;
  signIn(identifier: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser | 'redirect'>;
  signOut(): Promise<void>;
}

const INIT_FAILED_MESSAGE = 'Falha ao iniciar a autenticação. Tente recarregar a página.';

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}

function toAuthError(err: unknown): AuthError {
  return err instanceof AuthError ? err : new AuthError('init-failed', INIT_FAILED_MESSAGE);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialError, setInitialError] = useState<AuthError | null>(null);
  const [pending, setPending] = useState<AuthPending>(null);
  const [signedOutByUser, setSignedOutByUser] = useState(false);
  const serviceRef = useRef<AuthService | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    createAuthService((message) => toast({ message, tone: 'error' })).then(
      async (service) => {
        if (cancelled) return;
        serviceRef.current = service;
        try {
          await service.completeRedirect();
        } catch (err) {
          if (!cancelled) setInitialError(toAuthError(err));
        }
        if (cancelled) return;
        unsubscribe = service.subscribe((next) => {
          setUser(next);
          setStatus(next ? 'authenticated' : 'unauthenticated');
        });
      },
      (err: unknown) => {
        if (cancelled) return;
        setInitialError(toAuthError(err));
        setStatus('unauthenticated');
      },
    );

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [toast]);

  const markSignedIn = useCallback((next: AuthUser) => {
    setSignedOutByUser(false);
    setInitialError(null);
    setUser(next);
    setStatus('authenticated');
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const service = serviceRef.current;
      if (!service) throw new AuthError('init-failed', INIT_FAILED_MESSAGE);
      setPending('password');
      try {
        const next = await service.signInWithIdentifier(identifier, password);
        markSignedIn(next);
        return next;
      } finally {
        setPending(null);
      }
    },
    [markSignedIn],
  );

  // Sem `await` antes de service.signInWithGoogle(): o popup precisa abrir dentro do gesto do usuário.
  const signInWithGoogle = useCallback((): Promise<AuthUser | 'redirect'> => {
    const service = serviceRef.current;
    if (!service) return Promise.reject(new AuthError('init-failed', INIT_FAILED_MESSAGE));
    setPending('google');
    return service.signInWithGoogle().then(
      (result) => {
        // 'redirect': a página vai navegar; o botão continua em loading.
        if (result !== 'redirect') {
          setPending(null);
          markSignedIn(result);
        }
        return result;
      },
      (err: unknown) => {
        setPending(null);
        throw err;
      },
    );
  }, [markSignedIn]);

  const signOut = useCallback(async () => {
    const service = serviceRef.current;
    if (!service) return;
    setSignedOutByUser(true);
    try {
      await service.signOut();
    } catch (err) {
      setSignedOutByUser(false);
      throw err;
    }
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      mode: env.authMode,
      initialError,
      pending,
      signedOutByUser,
      signIn,
      signInWithGoogle,
      signOut,
    }),
    [status, user, initialError, pending, signedOutByUser, signIn, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

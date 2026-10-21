export type AuthProviderId = 'password' | 'google' | 'local';

export interface AuthUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  provider: AuthProviderId;
}

export type AuthErrorCode =
  | 'invalid-input'
  | 'invalid-credentials'
  | 'owner-not-configured'
  | 'too-many-requests'
  | 'network'
  | 'popup-closed'
  | 'unauthorized-domain'
  | 'insecure-context'
  | 'google-unavailable'
  | 'init-failed'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface AuthService {
  readonly mode: 'firebase' | 'local';
  /** Inscreve em mudanças de sessão; chama `cb` pelo menos uma vez com o estado inicial. Retorna unsubscribe. */
  subscribe(cb: (user: AuthUser | null) => void): () => void;
  /** Conclui redirect pendente do Google (Firebase) e relança AuthError se falhou. Local: resolve null. */
  completeRedirect(): Promise<AuthUser | null>;
  signInWithIdentifier(identifier: string, password: string): Promise<AuthUser>;
  /** 'redirect' quando o fluxo caiu no redirect (a página vai navegar). */
  signInWithGoogle(): Promise<AuthUser | 'redirect'>;
  signOut(): Promise<void>;
}

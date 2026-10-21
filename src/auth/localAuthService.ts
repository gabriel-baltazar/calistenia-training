import { resolveIdentifier } from './identifier';
import { OWNER_PASSWORD_SHA256, OWNER_USERNAME } from './ownerHash';
import { sha256Hex } from './sha256';
import { AuthError, type AuthService, type AuthUser } from './types';

export const LOCAL_SESSION_KEY = 'calistenia.auth.localSession.v1';
export const LOCAL_UID = 'local:gabalta';

const INVALID_CREDENTIALS = 'Usuário ou senha inválidos.';
export const SESSION_NOT_SAVED_MESSAGE = 'Sessão não pôde ser salva; você precisará entrar novamente.';

interface LocalSession {
  v: 1;
  uid: string;
  username: string;
  signedInAt: string;
}

const LOCAL_USER: AuthUser = {
  uid: LOCAL_UID,
  displayName: OWNER_USERNAME,
  email: null,
  photoURL: null,
  provider: 'local',
};

function isValidSession(value: unknown): value is LocalSession {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Partial<LocalSession>;
  return s.v === 1 && s.uid === LOCAL_UID;
}

/** Lê e valida a sessão salva. Malformada → remove e trata como deslogado. */
function readSession(): boolean {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LOCAL_SESSION_KEY);
  } catch {
    return false;
  }
  if (raw === null) return false;
  try {
    if (isValidSession(JSON.parse(raw))) return true;
  } catch {
    // cai no tratamento abaixo
  }
  console.warn('[auth] sessão local inválida; removida.');
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // ignora
  }
  return false;
}

export interface LocalAuthOptions {
  /** Avisos não fatais para a UI (ex.: sessão não pôde ser salva). */
  onWarning?: (message: string) => void;
}

/**
 * Modo local (sem Firebase): só o usuário gabalta, senha conferida por SHA-256 contra OWNER_PASSWORD_SHA256.
 * NÃO é segurança real (o hash está no bundle); ver README.
 */
export function createLocalAuthService(options: LocalAuthOptions = {}): AuthService {
  const listeners = new Set<(user: AuthUser | null) => void>();
  /** Sessão só em memória quando o localStorage falhou ao gravar. */
  let memoryUser: AuthUser | null = null;

  const current = (): AuthUser | null => memoryUser ?? (readSession() ? LOCAL_USER : null);
  const emit = (user: AuthUser | null) => {
    for (const listener of listeners) listener(user);
  };

  return {
    mode: 'local',

    subscribe(cb) {
      listeners.add(cb);
      cb(current());
      return () => {
        listeners.delete(cb);
      };
    },

    completeRedirect() {
      return Promise.resolve(null);
    },

    async signInWithIdentifier(identifier, password) {
      const resolved = resolveIdentifier(identifier, null);
      if (resolved.kind === 'email') {
        throw new AuthError('invalid-credentials', 'No modo local, entre com o usuário gabalta.');
      }
      if (resolved.kind === 'unknown-username') throw new AuthError('invalid-credentials', INVALID_CREDENTIALS);

      const hash = await sha256Hex(password);
      if (hash !== OWNER_PASSWORD_SHA256) throw new AuthError('invalid-credentials', INVALID_CREDENTIALS);

      const session: LocalSession = { v: 1, uid: LOCAL_UID, username: OWNER_USERNAME, signedInAt: new Date().toISOString() };
      try {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
        memoryUser = null;
      } catch {
        memoryUser = LOCAL_USER;
        console.warn('[auth] não foi possível salvar a sessão local; ela vale só até recarregar.');
        options.onWarning?.(SESSION_NOT_SAVED_MESSAGE);
      }
      emit(LOCAL_USER);
      return LOCAL_USER;
    },

    signInWithGoogle() {
      return Promise.reject(new AuthError('google-unavailable', 'Login com Google indisponível no modo local.'));
    },

    async signOut() {
      memoryUser = null;
      try {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      } catch {
        // ignora: a sessão em memória já foi descartada
      }
      emit(null);
    },
  };
}

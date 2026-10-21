import { AuthError, type AuthErrorCode } from './types';

type LogLevel = 'none' | 'warn' | 'error';

interface ErrorRule {
  code: AuthErrorCode;
  message: string;
  log: LogLevel;
}

const INVALID: ErrorRule = { code: 'invalid-credentials', message: 'Usuário ou senha inválidos.', log: 'none' };
const POPUP_CLOSED: ErrorRule = { code: 'popup-closed', message: '', log: 'none' };

const RULES: Record<string, ErrorRule> = {
  'auth/invalid-credential': INVALID,
  'auth/wrong-password': INVALID,
  'auth/user-not-found': INVALID,
  'auth/invalid-email': INVALID,
  'auth/user-disabled': INVALID,
  'auth/too-many-requests': {
    code: 'too-many-requests',
    message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    log: 'warn',
  },
  'auth/network-request-failed': {
    code: 'network',
    message: 'Sem conexão. Verifique sua internet e tente novamente.',
    log: 'warn',
  },
  'auth/popup-closed-by-user': POPUP_CLOSED,
  'auth/cancelled-popup-request': POPUP_CLOSED,
  'auth/user-cancelled': POPUP_CLOSED,
  'auth/unauthorized-domain': {
    code: 'unauthorized-domain',
    message:
      'Este domínio não está autorizado no Firebase. Adicione-o em Authentication › Settings › Authorized domains.',
    log: 'error',
  },
  'auth/operation-not-allowed': {
    code: 'unknown',
    message: 'Este método de login não está habilitado no Firebase.',
    log: 'error',
  },
};

const FALLBACK: ErrorRule = { code: 'unknown', message: 'Não foi possível entrar. Tente novamente.', log: 'error' };

/** Extrai o `code` de um FirebaseError (ou de qualquer objeto com `code` string). */
export function firebaseErrorCode(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return null;
}

/** Código do Firebase → AuthError pt-BR. Loga só o código (nunca senha, e-mail digitado ou token). */
export function mapFirebaseError(err: unknown): AuthError {
  if (err instanceof AuthError) return err;
  const fbCode = firebaseErrorCode(err);
  const rule = (fbCode !== null ? RULES[fbCode] : undefined) ?? FALLBACK;
  if (rule.log === 'warn') console.warn(`[auth] ${fbCode ?? 'erro'}`);
  else if (rule.log === 'error') console.error(`[auth] ${fbCode ?? 'erro desconhecido'}`);
  return new AuthError(rule.code, rule.message);
}

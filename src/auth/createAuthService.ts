import { env } from '../config/env';
import { createLocalAuthService } from './localAuthService';
import { AuthError, type AuthService } from './types';

let servicePromise: Promise<AuthService> | null = null;
let warningHandler: ((message: string) => void) | null = null;

async function build(): Promise<AuthService> {
  if (env.authMode === 'firebase' && env.firebase) {
    const firebase = env.firebase;
    try {
      // Import dinâmico: o SDK do Firebase só é baixado no modo Firebase.
      const { createFirebaseAuthService } = await import('./firebaseAuthService');
      return createFirebaseAuthService(firebase, env.ownerEmail);
    } catch (err) {
      if (err instanceof AuthError) throw err;
      console.error('[auth] falha ao carregar o módulo do Firebase', err);
      throw new AuthError('init-failed', 'Falha ao iniciar a autenticação. Tente recarregar a página.');
    }
  }
  return createLocalAuthService({ onWarning: (message) => warningHandler?.(message) });
}

/**
 * Cria (uma vez por sessão da página) o serviço de autenticação do modo atual.
 * `onWarning` recebe avisos não fatais do serviço (ex.: sessão local não salva).
 */
export function createAuthService(onWarning?: (message: string) => void): Promise<AuthService> {
  if (onWarning) warningHandler = onWarning;
  if (!servicePromise) {
    servicePromise = build();
    // Falha não fica em cache: recarregar o AuthProvider tenta de novo.
    servicePromise.catch(() => {
      servicePromise = null;
    });
  }
  return servicePromise;
}

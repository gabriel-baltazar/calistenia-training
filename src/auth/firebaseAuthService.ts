// Carregado só via `await import()` em createAuthService quando env.authMode === 'firebase'
// (o SDK vai para o chunk `firebase`, fora do carregamento inicial).
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from 'firebase/auth';
import type { FirebaseConfig } from '../config/env';
import { firebaseErrorCode, mapFirebaseError } from './firebaseErrors';
import { resolveIdentifier } from './identifier';
import { OWNER_USERNAME } from './ownerHash';
import { AuthError, type AuthService, type AuthUser } from './types';

/** Erros do popup que justificam cair para o redirect. */
const REDIRECT_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-environment',
  'auth/web-storage-unsupported',
]);

export function createFirebaseAuthService(config: FirebaseConfig, ownerEmail: string | null): AuthService {
  let auth: Auth;
  try {
    const app = initializeApp(config);
    auth = getAuth(app);
    auth.languageCode = 'pt-BR';
  } catch (err) {
    console.error('[auth] falha ao iniciar o Firebase', firebaseErrorCode(err) ?? err);
    throw new AuthError('init-failed', 'Falha ao iniciar a autenticação. Tente recarregar a página.');
  }

  const toAuthUser = (user: User): AuthUser => {
    const email = user.email;
    const isOwner = ownerEmail !== null && email?.toLowerCase() === ownerEmail;
    return {
      uid: user.uid,
      displayName: user.displayName ?? (isOwner ? OWNER_USERNAME : (email?.split('@')[0] ?? 'Atleta')),
      email,
      photoURL: user.photoURL,
      provider: user.providerData.some((p) => p.providerId === 'google.com') ? 'google' : 'password',
    };
  };

  return {
    mode: 'firebase',

    subscribe(cb) {
      return onAuthStateChanged(auth, (user) => cb(user ? toAuthUser(user) : null));
    },

    async completeRedirect() {
      try {
        const result = await getRedirectResult(auth);
        return result ? toAuthUser(result.user) : null;
      } catch (err) {
        throw mapFirebaseError(err);
      }
    },

    async signInWithIdentifier(identifier, password) {
      const resolved = resolveIdentifier(identifier, ownerEmail);
      if (resolved.kind === 'unknown-username') {
        throw new AuthError('invalid-credentials', 'Usuário ou senha inválidos.');
      }
      if (resolved.email === null) {
        console.warn('[auth] VITE_OWNER_EMAIL ausente: usuário gabalta indisponível.');
        throw new AuthError('owner-not-configured', 'Usuário gabalta não configurado: defina VITE_OWNER_EMAIL.');
      }
      try {
        const credential = await signInWithEmailAndPassword(auth, resolved.email, password);
        return toAuthUser(credential.user);
      } catch (err) {
        throw mapFirebaseError(err);
      }
    },

    signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // Regra do gesto do usuário: signInWithPopup é chamado de forma síncrona, sem nenhum `await` antes,
      // senão o navegador bloqueia o popup.
      return signInWithPopup(auth, provider).then(
        (credential): AuthUser | 'redirect' => toAuthUser(credential.user),
        async (err: unknown): Promise<AuthUser | 'redirect'> => {
          const code = firebaseErrorCode(err);
          if (code === null || !REDIRECT_FALLBACK_CODES.has(code)) throw mapFirebaseError(err);
          try {
            await signInWithRedirect(auth, provider);
          } catch (redirectErr) {
            throw mapFirebaseError(redirectErr);
          }
          return 'redirect';
        },
      );
    },

    async signOut() {
      await firebaseSignOut(auth);
    },
  };
}

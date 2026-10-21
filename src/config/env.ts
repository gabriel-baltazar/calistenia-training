export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export type AuthMode = 'firebase' | 'local';

export interface AppEnv {
  firebase: FirebaseConfig | null;
  /** E-mail do dono, sempre em minúsculas. */
  ownerEmail: string | null;
  authMode: AuthMode;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EnvName =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_APP_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_OWNER_EMAIL';

export type RawEnv = Partial<Record<EnvName, string | undefined>>;

/** trim; string vazia conta como ausente. */
function clean(value: string | undefined): string | undefined {
  const v = typeof value === 'string' ? value.trim() : '';
  return v === '' ? undefined : v;
}

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

/** Lê e valida as VITE_* (pura salvo os console.warn; exportada para testes). */
export function parseEnv(raw: RawEnv): AppEnv {
  const apiKey = clean(raw.VITE_FIREBASE_API_KEY);
  const authDomain = clean(raw.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = clean(raw.VITE_FIREBASE_PROJECT_ID);
  const appId = clean(raw.VITE_FIREBASE_APP_ID);
  const storageBucket = clean(raw.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = clean(raw.VITE_FIREBASE_MESSAGING_SENDER_ID);

  let firebase: FirebaseConfig | null = null;
  if (apiKey && authDomain && projectId && appId) {
    firebase = { apiKey, authDomain, projectId, appId };
    if (storageBucket) firebase.storageBucket = storageBucket;
    if (messagingSenderId) firebase.messagingSenderId = messagingSenderId;
  } else {
    const missing = REQUIRED.filter((name) => clean(raw[name]) === undefined);
    if (missing.length > 0 && missing.length < REQUIRED.length) {
      // Só os nomes das variáveis, nunca os valores.
      console.warn(`[auth] Config Firebase incompleta; faltando: ${missing.join(', ')}`);
    }
  }

  let ownerEmail: string | null = null;
  const rawOwner = clean(raw.VITE_OWNER_EMAIL);
  if (rawOwner !== undefined) {
    if (EMAIL_RE.test(rawOwner)) ownerEmail = rawOwner.toLowerCase();
    else console.warn('[auth] VITE_OWNER_EMAIL inválido; ignorado.');
  }

  return { firebase, ownerEmail, authMode: firebase ? 'firebase' : 'local' };
}

export const env: AppEnv = parseEnv({
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_OWNER_EMAIL: import.meta.env.VITE_OWNER_EMAIL,
});

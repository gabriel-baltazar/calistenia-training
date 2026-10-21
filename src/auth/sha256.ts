import { AuthError } from './types';

/** SHA-256 (UTF-8) em hex minúsculo via Web Crypto. Sem crypto.subtle (contexto não seguro) → AuthError. */
export async function sha256Hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    console.warn('[auth] crypto.subtle indisponível (contexto não seguro).');
    throw new AuthError('insecure-context', 'O login local exige HTTPS ou localhost.');
  }
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

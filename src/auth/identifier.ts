import { OWNER_USERNAME } from './ownerHash';

export type ResolvedIdentifier =
  | { kind: 'email'; email: string }
  | { kind: 'owner'; email: string | null }
  | { kind: 'unknown-username' };

/** Usuário ou e-mail digitado → e-mail (minúsculo), dono (gabalta → ownerEmail) ou usuário desconhecido. */
export function resolveIdentifier(raw: string, ownerEmail: string | null): ResolvedIdentifier {
  const id = raw.trim();
  if (id.includes('@')) return { kind: 'email', email: id.toLowerCase() };
  if (id.toLowerCase() === OWNER_USERNAME) return { kind: 'owner', email: ownerEmail };
  return { kind: 'unknown-username' };
}

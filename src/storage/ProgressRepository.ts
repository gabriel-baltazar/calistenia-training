import type { UserProgressDoc } from './types';
import { validateProgressDoc } from './validate';

/** Armazenamento "burro" do progresso por uid. Um FirestoreProgressRepository futuro implementa a mesma interface. */
export interface ProgressRepository {
  /** null = usuário sem dados (ou doc salvo corrompido, já copiado para backup). */
  load(uid: string): Promise<UserProgressDoc | null>;
  /** Upsert por doc.uid. */
  save(doc: UserProgressDoc): Promise<void>;
  remove(uid: string): Promise<void>;
}

export const CORRUPT_BACKUP_PREFIX = 'calistenia.progress.corrupt.';

/** Copia o bruto de um doc inválido para `calistenia.progress.corrupt.<uid>.<ts>` no localStorage. */
export function backupCorruptDoc(uid: string, raw: unknown): void {
  const key = `${CORRUPT_BACKUP_PREFIX}${uid}.${Date.now()}`;
  try {
    localStorage.setItem(key, typeof raw === 'string' ? raw : JSON.stringify(raw));
  } catch (err) {
    console.error('[storage] não foi possível salvar o backup do progresso corrompido', err);
  }
}

/**
 * Valida (modo `load`, só estrutura) o que o repositório leu. Inválido → backup do bruto, `removeOriginal()`,
 * console.error e null: o usuário recomeça sem perder o bruto.
 */
export async function finishLoad(
  uid: string,
  raw: unknown,
  removeOriginal: () => Promise<void>,
): Promise<UserProgressDoc | null> {
  if (raw === undefined || raw === null) return null;
  // Modo `load` não consulta o registry: planos desconhecidos, activePlanId e chaves órfãs são preservados.
  const result = validateProgressDoc(raw, [], { mode: 'load' });
  if (result.ok) return result.doc;
  console.error(`[storage] progresso salvo inválido (${result.reason}); copiado para backup e ignorado.`);
  backupCorruptDoc(uid, raw);
  await removeOriginal();
  return null;
}

import { finishLoad, type ProgressRepository } from './ProgressRepository';
import type { UserProgressDoc } from './types';

export const LS_PROGRESS_PREFIX = 'calistenia.progress.v1.';

export const progressStorageKey = (uid: string): string => `${LS_PROGRESS_PREFIX}${uid}`;

/** Fallback quando o IndexedDB não está disponível: um JSON por uid no localStorage. */
export class LocalStorageProgressRepository implements ProgressRepository {
  async load(uid: string): Promise<UserProgressDoc | null> {
    const raw = localStorage.getItem(progressStorageKey(uid));
    if (raw === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // JSON quebrado: finishLoad copia o texto bruto para backup e remove o original.
      parsed = raw;
    }
    return finishLoad(uid, parsed, () => this.remove(uid));
  }

  async save(doc: UserProgressDoc): Promise<void> {
    localStorage.setItem(progressStorageKey(doc.uid), JSON.stringify(doc));
  }

  async remove(uid: string): Promise<void> {
    localStorage.removeItem(progressStorageKey(uid));
  }
}

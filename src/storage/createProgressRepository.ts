import { IndexedDbProgressRepository, openProgressDb } from './IndexedDbProgressRepository';
import { LocalStorageProgressRepository } from './LocalStorageProgressRepository';
import type { ProgressRepository } from './ProgressRepository';

const IDB_OPEN_TIMEOUT_MS = 3000;

let repositoryPromise: Promise<ProgressRepository> | null = null;

async function choose(): Promise<ProgressRepository> {
  if (typeof indexedDB === 'undefined') {
    console.warn('[storage] IndexedDB indisponível; usando localStorage');
    return new LocalStorageProgressRepository();
  }
  const opening = openProgressDb();
  let timeoutHandle = 0;
  let timedOut = false;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = window.setTimeout(() => {
      timedOut = true;
      reject(new Error('timeout ao abrir o IndexedDB'));
    }, IDB_OPEN_TIMEOUT_MS);
  });
  try {
    const db = await Promise.race([opening, timeout]);
    return new IndexedDbProgressRepository(db);
  } catch {
    // Abriu depois do timeout: fecha a conexão que não será usada.
    if (timedOut) opening.then((db) => db.close(), () => undefined);
    console.warn('[storage] IndexedDB indisponível; usando localStorage');
    return new LocalStorageProgressRepository();
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}

/** IndexedDB (timeout de 3 s) ou localStorage. A escolha vale para a sessão inteira da página. */
export function createProgressRepository(): Promise<ProgressRepository> {
  if (!repositoryPromise) repositoryPromise = choose();
  return repositoryPromise;
}

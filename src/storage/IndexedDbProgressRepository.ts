import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { finishLoad, type ProgressRepository } from './ProgressRepository';
import type { UserProgressDoc } from './types';

export const IDB_NAME = 'calistenia-training';
export const IDB_VERSION = 1;
export const IDB_STORE = 'progress';

interface ProgressDb extends DBSchema {
  progress: {
    key: string;
    /** O conteúdo é validado na leitura; pode estar corrompido. */
    value: unknown;
  };
}

export type ProgressDatabase = IDBPDatabase<ProgressDb>;

export function openProgressDb(): Promise<ProgressDatabase> {
  return openDB<ProgressDb>(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'uid' });
    },
  });
}

export class IndexedDbProgressRepository implements ProgressRepository {
  private dbPromise: Promise<ProgressDatabase> | null;

  /** `db` opcional: conexão já aberta pela factory; senão abre lazy e reaproveita. */
  constructor(db?: ProgressDatabase) {
    this.dbPromise = db ? Promise.resolve(db) : null;
  }

  private db(): Promise<ProgressDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openProgressDb();
      this.dbPromise.catch(() => {
        this.dbPromise = null;
      });
    }
    return this.dbPromise;
  }

  async load(uid: string): Promise<UserProgressDoc | null> {
    const db = await this.db();
    const raw = await db.get(IDB_STORE, uid);
    return finishLoad(uid, raw, () => this.remove(uid));
  }

  async save(doc: UserProgressDoc): Promise<void> {
    const db = await this.db();
    await db.put(IDB_STORE, doc);
  }

  async remove(uid: string): Promise<void> {
    const db = await this.db();
    await db.delete(IDB_STORE, uid);
  }
}

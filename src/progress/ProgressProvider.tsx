import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { LOCAL_UID } from '../auth/localAuthService';
import type { AuthUser } from '../auth/types';
import { Splash } from '../components/layout/Splash';
import { useToast } from '../components/ui/Toast';
import { env } from '../config/env';
import { isValidISODate } from '../lib/dates';
import { downloadFile } from '../lib/download';
import { getPlan } from '../plans/registry';
import type { Exercise, TrainingPlan } from '../plans/types';
import { createProgressRepository } from '../storage/createProgressRepository';
import { createEmptyDoc, createPlanProgress } from '../storage/defaults';
import { exportFileName, serializeExport } from '../storage/exportImport';
import {
  LEGACY_PLAN_ID,
  MIGRATION_MARKER_KEY,
  applyLegacy,
  migrateLegacyState,
  readLegacyRaw,
  type LegacyMigrationResult,
} from '../storage/legacyMigration';
import type { ProgressRepository } from '../storage/ProgressRepository';
import type { PlanProgress, UserProgressDoc, UserSettings } from '../storage/types';
import { ProgressErrorCard } from './ProgressErrorCard';
import { setKey } from './selectors';

export interface ProgressContextValue {
  /** Nunca nulo: o provider só renderiza os filhos quando o progresso está pronto. */
  doc: UserProgressDoc;
  /** A chave do app antigo existe neste navegador (Perfil mostra "Importar do app antigo"). */
  hasLegacyData: boolean;
  selectPlan(planId: string, startDate: string): void;
  setStartDate(date: string): void;
  /** Retorna o novo valor da série (true = marcada). */
  toggleSet(day: number, exerciseId: string, set: number): boolean;
  /** Retorna o novo valor do dia (true = concluído). */
  toggleDay(day: number): boolean;
  resetDaySets(day: number): void;
  resetPlan(): void;
  updateSettings(partial: Partial<UserSettings>): void;
  /** Import: substitui o doc inteiro (regravado com o uid da sessão). */
  replaceDoc(doc: UserProgressDoc): void;
  /** Migração manual do app antigo (= replaceDoc(applyLegacy(doc, result))). */
  applyLegacyMigration(result: LegacyMigrationResult): void;
  /** Baixa o JSON de export. */
  exportDoc(): void;
  /** Refaz o load (usado a partir do estado de erro). */
  reload(): void;
  /** Toast "plano salvo indisponível", no máximo uma vez por montagem do provider. */
  notifyMissingPlanOnce(): void;
}

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; doc: UserProgressDoc };

const SAVE_ERROR_MESSAGE = 'Não foi possível salvar seu progresso neste dispositivo.';
const SAVE_ERROR_TOAST_INTERVAL_MS = 10_000;
const CHANNEL_NAME = 'calistenia-progress';

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress precisa estar dentro de <ProgressProvider>.');
  return ctx;
}

/** Violação de invariante de domínio = bug de programação: a operação é ignorada. */
function invariant(message: string): void {
  if (import.meta.env.DEV) console.error(`[progress] ${message}`);
}

const isOwnerAccount = (user: AuthUser | null): boolean =>
  user !== null && user.provider !== 'local' && env.ownerEmail !== null && user.email?.toLowerCase() === env.ownerEmail;

function withPlanProgress(doc: UserProgressDoc, progress: PlanProgress): UserProgressDoc {
  return { ...doc, plans: { ...doc.plans, [progress.planId]: { ...progress, updatedAt: new Date().toISOString() } } };
}

const findExercise = (plan: TrainingPlan, day: number, exerciseId: string): Exercise | undefined =>
  plan.days[day - 1]?.exercises.find((ex) => ex.id === exerciseId);

const isValidDay = (plan: TrainingPlan, day: number): boolean =>
  Number.isInteger(day) && day >= 1 && day <= plan.durationDays;

interface BroadcastMessage {
  uid: string;
  updatedAt: string;
}

export function ProgressProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [hasLegacyData] = useState(() => readLegacyRaw() !== null);

  const docRef = useRef<UserProgressDoc | null>(null);
  const repoRef = useRef<ProgressRepository | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastSaveErrorToastRef = useRef(0);
  const missingPlanNotifiedRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const mountedRef = useRef(false);
  const loadStartedRef = useRef(false);
  const userRef = useRef(user);
  const toastRef = useRef(toast);

  useEffect(() => {
    userRef.current = user;
    toastRef.current = toast;
  }, [user, toast]);

  const notifySaveError = useCallback((err: unknown) => {
    console.error('[storage] falha ao salvar o progresso', err);
    const now = Date.now();
    if (now - lastSaveErrorToastRef.current < SAVE_ERROR_TOAST_INTERVAL_MS) return;
    lastSaveErrorToastRef.current = now;
    toastRef.current({ message: SAVE_ERROR_MESSAGE, tone: 'error' });
  }, []);

  /** Enfileira a gravação (serializada: a última vence) e avisa as outras abas. */
  const persist = useCallback(
    (doc: UserProgressDoc) => {
      const repo = repoRef.current;
      if (!repo) return;
      saveQueueRef.current = saveQueueRef.current
        .then(() => repo.save(doc))
        .then(
          () => {
            const message: BroadcastMessage = { uid: doc.uid, updatedAt: doc.updatedAt };
            channelRef.current?.postMessage(message);
          },
          notifySaveError,
        );
    },
    [notifySaveError],
  );

  /** Grava um doc obtido no load (adoção/migração) sem derrubar o load se o save falhar. */
  const saveDuringLoad = useCallback(
    async (repo: ProgressRepository, doc: UserProgressDoc) => {
      try {
        await repo.save(doc);
      } catch (err) {
        notifySaveError(err);
      }
    },
    [notifySaveError],
  );

  /** Migração automática do app antigo: uma única tentativa por navegador (marcador em todos os desfechos). */
  const autoMigrateLegacy = useCallback((): LegacyMigrationResult | null => {
    const raw = readLegacyRaw();
    if (raw === null) return null;
    try {
      if (localStorage.getItem(MIGRATION_MARKER_KEY) !== null) return null;
    } catch {
      return null;
    }
    const plan = getPlan(LEGACY_PLAN_ID);
    if (!plan) return null;
    let result: LegacyMigrationResult | null = null;
    try {
      result = migrateLegacyState(JSON.parse(raw), plan, new Date());
    } catch {
      console.warn('[migração] dados do app antigo ilegíveis; ignorados.');
    }
    try {
      localStorage.setItem(MIGRATION_MARKER_KEY, JSON.stringify({ uid, at: new Date().toISOString() }));
    } catch {
      // sem marcador: a próxima carga tentaria de novo, o que é inofensivo
    }
    return result;
  }, [uid]);

  const loadDoc = useCallback(async (): Promise<UserProgressDoc> => {
    const repo = await createProgressRepository();
    repoRef.current = repo;

    // 1. Doc salvo
    const saved = await repo.load(uid);
    if (saved) return saved;

    // 2. Adoção do progresso do modo local pela conta Firebase do dono
    if (isOwnerAccount(userRef.current)) {
      const local = await repo.load(LOCAL_UID);
      if (local) {
        const adopted: UserProgressDoc = { ...local, uid, updatedAt: new Date().toISOString() };
        await saveDuringLoad(repo, adopted);
        toastRef.current({ message: 'Progresso do modo local transferido para sua conta.', tone: 'success' });
        return adopted;
      }
    }

    // 3. Migração automática do app antigo
    const migration = autoMigrateLegacy();
    if (migration) {
      const migrated = applyLegacy(createEmptyDoc(uid), migration);
      await saveDuringLoad(repo, migrated);
      toastRef.current({
        message: `Importamos seu progresso do app antigo: ${migration.stats.days} dias e ${migration.stats.sets} séries.`,
        tone: 'success',
      });
      return migrated;
    }

    // 4. Doc vazio (salvo só na primeira mutação)
    return createEmptyDoc(uid);
  }, [uid, saveDuringLoad, autoMigrateLegacy]);

  const runLoad = useCallback(() => {
    setState({ status: 'loading' });
    loadDoc().then(
      (doc) => {
        docRef.current = doc;
        if (mountedRef.current) setState({ status: 'ready', doc });
      },
      (err: unknown) => {
        console.error('[storage] falha ao carregar o progresso', err);
        if (mountedRef.current) setState({ status: 'error' });
      },
    );
  }, [loadDoc]);

  useEffect(() => {
    mountedRef.current = true;
    // Uma carga por montagem (o StrictMode remonta o efeito; refazer o load repetiria a migração/toasts).
    if (!loadStartedRef.current) {
      loadStartedRef.current = true;
      runLoad();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [runLoad]);

  // Multi-aba: recarrega do repositório quando outra aba salvou uma versão mais nova do mesmo uid.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const data = event.data;
      const current = docRef.current;
      const repo = repoRef.current;
      if (!data || data.uid !== uid || !current || !repo || !(data.updatedAt > current.updatedAt)) return;
      repo.load(uid).then(
        (doc) => {
          if (!doc || !mountedRef.current) return;
          const latest = docRef.current;
          if (latest && doc.updatedAt <= latest.updatedAt) return;
          docRef.current = doc;
          setState({ status: 'ready', doc });
        },
        (err: unknown) => console.error('[storage] falha ao sincronizar com outra aba', err),
      );
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [uid]);

  /** Aplica uma mutação síncrona: novo doc (updatedAt = agora) no estado + gravação enfileirada. */
  const commit = useCallback(
    (next: UserProgressDoc) => {
      const stamped: UserProgressDoc = { ...next, uid, updatedAt: new Date().toISOString() };
      docRef.current = stamped;
      setState({ status: 'ready', doc: stamped });
      persist(stamped);
    },
    [uid, persist],
  );

  /** Plano ativo + progresso dele, ou null (com log de invariante). */
  const activeContext = useCallback((op: string): { doc: UserProgressDoc; plan: TrainingPlan; progress: PlanProgress } | null => {
    const doc = docRef.current;
    if (!doc) return null;
    const plan = getPlan(doc.activePlanId);
    const progress = doc.activePlanId !== null ? doc.plans[doc.activePlanId] : undefined;
    if (!plan || !progress) {
      invariant(`${op}: sem plano ativo válido`);
      return null;
    }
    return { doc, plan, progress };
  }, []);

  const selectPlan = useCallback(
    (planId: string, startDate: string) => {
      const doc = docRef.current;
      if (!doc) return;
      if (!getPlan(planId)) return invariant(`selectPlan: plano "${planId}" não existe`);
      if (!isValidISODate(startDate)) return invariant(`selectPlan: data inválida "${startDate}"`);
      const existing = doc.plans[planId];
      const progress = existing ? { ...existing, startDate } : createPlanProgress(planId, startDate);
      commit({ ...withPlanProgress(doc, progress), activePlanId: planId });
    },
    [commit],
  );

  const setStartDate = useCallback(
    (date: string) => {
      const ctx = activeContext('setStartDate');
      if (!ctx) return;
      if (!isValidISODate(date)) return invariant(`setStartDate: data inválida "${date}"`);
      commit(withPlanProgress(ctx.doc, { ...ctx.progress, startDate: date }));
    },
    [activeContext, commit],
  );

  const toggleSet = useCallback(
    (day: number, exerciseId: string, set: number): boolean => {
      const ctx = activeContext('toggleSet');
      if (!ctx) return false;
      const exercise = isValidDay(ctx.plan, day) ? findExercise(ctx.plan, day, exerciseId) : undefined;
      if (!exercise || !Number.isInteger(set) || set < 1 || set > exercise.sets) {
        invariant(`toggleSet: série inválida ${setKey(day, exerciseId, set)}`);
        return false;
      }
      const key = setKey(day, exerciseId, set);
      const completedSets = { ...ctx.progress.completedSets };
      const done = completedSets[key] !== true;
      if (done) completedSets[key] = true;
      else delete completedSets[key];
      commit(withPlanProgress(ctx.doc, { ...ctx.progress, completedSets }));
      return done;
    },
    [activeContext, commit],
  );

  const toggleDay = useCallback(
    (day: number): boolean => {
      const ctx = activeContext('toggleDay');
      if (!ctx) return false;
      if (!isValidDay(ctx.plan, day)) {
        invariant(`toggleDay: dia inválido ${day}`);
        return false;
      }
      const key = String(day);
      const completedDays = { ...ctx.progress.completedDays };
      const done = completedDays[key] === undefined;
      // Concluir não marca as séries e desconcluir não as limpa (paridade com o legado).
      if (done) completedDays[key] = { completedAt: new Date().toISOString() };
      else delete completedDays[key];
      commit(withPlanProgress(ctx.doc, { ...ctx.progress, completedDays }));
      return done;
    },
    [activeContext, commit],
  );

  const resetDaySets = useCallback(
    (day: number) => {
      const ctx = activeContext('resetDaySets');
      if (!ctx) return;
      if (!isValidDay(ctx.plan, day)) return invariant(`resetDaySets: dia inválido ${day}`);
      const prefix = `${day}:`;
      const completedSets: Record<string, true> = {};
      for (const key of Object.keys(ctx.progress.completedSets)) {
        if (!key.startsWith(prefix)) completedSets[key] = true;
      }
      commit(withPlanProgress(ctx.doc, { ...ctx.progress, completedSets }));
    },
    [activeContext, commit],
  );

  const resetPlan = useCallback(() => {
    const ctx = activeContext('resetPlan');
    if (!ctx) return;
    // Mantém startDate e as preferências.
    commit(withPlanProgress(ctx.doc, { ...ctx.progress, completedDays: {}, completedSets: {} }));
  }, [activeContext, commit]);

  const updateSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      const doc = docRef.current;
      if (!doc) return;
      commit({ ...doc, settings: { ...doc.settings, ...partial } });
    },
    [commit],
  );

  const replaceDoc = useCallback((next: UserProgressDoc) => commit({ ...next, uid }), [commit, uid]);

  const applyLegacyMigration = useCallback(
    (result: LegacyMigrationResult) => {
      const doc = docRef.current;
      if (!doc) return;
      commit(applyLegacy(doc, result));
    },
    [commit],
  );

  const exportDoc = useCallback(() => {
    const doc = docRef.current;
    if (!doc) return;
    downloadFile(exportFileName(), serializeExport(doc));
  }, []);

  const notifyMissingPlanOnce = useCallback(() => {
    if (missingPlanNotifiedRef.current) return;
    missingPlanNotifiedRef.current = true;
    console.warn('[progress] plano ativo salvo não existe mais no registry');
    toastRef.current({ message: 'O plano salvo não está mais disponível. Escolha outro.', tone: 'info' });
  }, []);

  const readyDoc = state.status === 'ready' ? state.doc : null;

  const value = useMemo<ProgressContextValue | null>(
    () =>
      readyDoc
        ? {
            doc: readyDoc,
            hasLegacyData,
            selectPlan,
            setStartDate,
            toggleSet,
            toggleDay,
            resetDaySets,
            resetPlan,
            updateSettings,
            replaceDoc,
            applyLegacyMigration,
            exportDoc,
            reload: runLoad,
            notifyMissingPlanOnce,
          }
        : null,
    [
      readyDoc,
      hasLegacyData,
      selectPlan,
      setStartDate,
      toggleSet,
      toggleDay,
      resetDaySets,
      resetPlan,
      updateSettings,
      replaceDoc,
      applyLegacyMigration,
      exportDoc,
      runLoad,
      notifyMissingPlanOnce,
    ],
  );

  if (state.status === 'loading') return <Splash />;
  if (state.status === 'error' || !value) return <ProgressErrorCard onRetry={runLoad} />;
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

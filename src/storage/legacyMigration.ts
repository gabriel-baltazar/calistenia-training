import { addDays, localISODate } from '../lib/dates';
import type { Equipment, TrainingPlan } from '../plans/types';
import type { DayCompletion, PlanProgress, UserProgressDoc, UserSettings } from './types';
import { isPlainObject } from './validate';

/** Chave do app antigo (index.html legado). Nunca é apagada (migração não destrutiva). */
export const LEGACY_KEY = 'spartan28_state_v2';
/** Marcador: uma única tentativa automática por navegador. */
export const MIGRATION_MARKER_KEY = 'calistenia.legacyMigration.v1';
export const LEGACY_PLAN_ID = 'calistenia-28';

/** O legado só tinha 28 dias: este número fica fixo apenas aqui. */
const LEGACY_DAYS = 28;
const LEGACY_SET_KEY_RE = /^day(\d+)_ex(\d+)_set(\d+)$/;

export interface LegacyMigrationResult {
  /** planId 'calistenia-28'. */
  planProgress: PlanProgress;
  settings: Pick<UserSettings, 'equipment' | 'showPhotos'>;
  stats: { days: number; sets: number; dropped: number };
}

/**
 * Converte o estado do app antigo (`spartan28_state_v2`) em progresso do plano calistenia-28.
 * Pura e com limites conferidos (nunca lança por chave estranha). null = nada a migrar.
 */
export function migrateLegacyState(raw: unknown, plan: TrainingPlan, today: Date): LegacyMigrationResult | null {
  if (!isPlainObject(raw)) return null;
  const rawDays = isPlainObject(raw.completedDays) ? raw.completedDays : {};
  const rawSets = isPlainObject(raw.completedSets) ? raw.completedSets : {};

  const completedDays: Record<string, DayCompletion> = {};
  for (const [k, v] of Object.entries(rawDays)) {
    const n = Number(k);
    if (v === true && Number.isInteger(n) && n >= 1 && n <= LEGACY_DAYS) completedDays[String(n)] = { completedAt: null };
  }

  const completedSets: Record<string, true> = {};
  let dropped = 0;
  for (const [key, v] of Object.entries(rawSets)) {
    if (v !== true) continue;
    const m = LEGACY_SET_KEY_RE.exec(key);
    if (!m) {
      dropped++;
      continue;
    }
    const d = Number(m[1]);
    const i = Number(m[2]);
    const s = Number(m[3]);
    const ex = d >= 1 && d <= LEGACY_DAYS ? plan.days[d - 1]?.exercises[i] : undefined;
    if (ex && s >= 1 && s <= ex.sets) completedSets[`${d}:${ex.id}:${s}`] = true;
    else dropped++;
  }

  const selectedDay =
    typeof raw.selectedDay === 'number' && Number.isInteger(raw.selectedDay) && raw.selectedDay >= 1 && raw.selectedDay <= LEGACY_DAYS
      ? raw.selectedDay
      : 1;
  const equipment: Equipment = raw.equipment === 'none' ? 'none' : 'bar';
  const showPhotos = raw.visualMode !== 'anatomy';

  const days = Object.keys(completedDays).length;
  const sets = Object.keys(completedSets).length;
  if (days === 0 && sets === 0 && selectedDay === 1 && equipment === 'bar' && showPhotos) return null;

  return {
    planProgress: {
      planId: plan.id,
      startDate: addDays(localISODate(today), -(selectedDay - 1)),
      completedDays,
      completedSets,
      updatedAt: today.toISOString(),
    },
    settings: { equipment, showPhotos },
    stats: { days, sets, dropped },
  };
}

/**
 * Aplica a migração sobre `base`: substitui só o progresso do calistenia-28 e as duas preferências migradas,
 * e torna esse plano o ativo. Outros planos, animateMedia, sound, uid e createdAt ficam como estão.
 */
export function applyLegacy(base: UserProgressDoc, m: LegacyMigrationResult): UserProgressDoc {
  const now = new Date().toISOString();
  return {
    ...base,
    activePlanId: LEGACY_PLAN_ID,
    plans: { ...base.plans, [LEGACY_PLAN_ID]: { ...m.planProgress, updatedAt: now } },
    settings: { ...base.settings, equipment: m.settings.equipment, showPhotos: m.settings.showPhotos },
    updatedAt: now,
  };
}

/** Lê o valor bruto da chave legada (null se ausente ou se o localStorage falhar). */
export function readLegacyRaw(): string | null {
  try {
    return localStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
}

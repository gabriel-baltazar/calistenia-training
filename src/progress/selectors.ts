import { addDays, diffDays, localISODate } from '../lib/dates';
import type { PlanDay, TrainingPlan } from '../plans/types';
import type { PlanProgress, UserProgressDoc } from '../storage/types';

// Funções puras. Todas percorrem o plano (dias, exercícios e séries existentes) e consultam as chaves salvas:
// chaves órfãs (preservadas pelo modo `load`) são ignoradas na exibição, mas nunca apagadas aqui.

export const setKey = (day: number, exerciseId: string, set: number): string => `${day}:${exerciseId}:${set}`;

export function isSetDone(progress: PlanProgress, day: number, exerciseId: string, set: number): boolean {
  return progress.completedSets[setKey(day, exerciseId, set)] === true;
}

export function isDayDone(progress: PlanProgress, day: number): boolean {
  return progress.completedDays[String(day)] !== undefined;
}

/** Progresso do plano ativo (null sem plano ativo ou sem registro para ele). */
export function activePlanProgress(doc: UserProgressDoc): PlanProgress | null {
  return doc.activePlanId !== null ? (doc.plans[doc.activePlanId] ?? null) : null;
}

/** Dia do plano correspondente a hoje: clamp(diffDays(startDate, hoje) + 1, 1, durationDays). */
export function todayDay(progress: PlanProgress, plan: TrainingPlan, now: Date = new Date()): number {
  const n = diffDays(progress.startDate, localISODate(now)) + 1;
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(n, 1), plan.durationDays);
}

/** Dias até o início (0 quando o plano já começou). */
export function daysUntilStart(progress: PlanProgress, now: Date = new Date()): number {
  const d = diffDays(localISODate(now), progress.startDate);
  return Number.isFinite(d) && d > 0 ? d : 0;
}

export function daySetStats(progress: PlanProgress, planDay: PlanDay): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const ex of planDay.exercises) {
    for (let s = 1; s <= ex.sets; s++) {
      total++;
      if (isSetDone(progress, planDay.day, ex.id, s)) done++;
    }
  }
  return { done, total };
}

export interface PlanStats {
  daysDone: number;
  durationDays: number;
  /** round(daysDone / durationDays * 100) */
  pct: number;
  setsDone: number;
}

export function planStats(progress: PlanProgress, plan: TrainingPlan): PlanStats {
  let daysDone = 0;
  let setsDone = 0;
  for (const planDay of plan.days) {
    if (isDayDone(progress, planDay.day)) daysDone++;
    setsDone += daySetStats(progress, planDay).done;
  }
  const durationDays = plan.durationDays;
  return { daysDone, durationDays, pct: durationDays > 0 ? Math.round((daysDone / durationDays) * 100) : 0, setsDone };
}

/** Datas locais (AAAA-MM-DD) dos dias do plano concluídos com data (migrados sem data não contam). */
function completionDates(progress: PlanProgress, plan: TrainingPlan): Set<string> {
  const dates = new Set<string>();
  for (const planDay of plan.days) {
    const at = progress.completedDays[String(planDay.day)]?.completedAt;
    if (!at) continue;
    const date = new Date(at);
    if (!Number.isNaN(date.getTime())) dates.add(localISODate(date));
  }
  return dates;
}

/**
 * Sequência por dia de calendário. Atual = dias consecutivos terminando hoje (ou ontem, se hoje ainda
 * não tem conclusão). Melhor = maior sequência no conjunto.
 */
export function streaks(progress: PlanProgress, plan: TrainingPlan, now: Date = new Date()): { current: number; best: number } {
  const dates = completionDates(progress, plan);
  const today = localISODate(now);

  let current = 0;
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of [...dates].sort()) {
    run = previous !== null && diffDays(previous, date) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    previous = date;
  }
  return { current, best };
}

/** Menor dia não concluído, ou null se todos estão concluídos. */
export function nextIncompleteDay(progress: PlanProgress, plan: TrainingPlan): number | null {
  for (const planDay of plan.days) {
    if (!isDayDone(progress, planDay.day)) return planDay.day;
  }
  return null;
}

export interface HistoryEntry {
  day: number;
  title: string;
  /** null = importado do app antigo. */
  completedAt: string | null;
}

/** Dias concluídos, mais recente primeiro; os importados sem data vão ao fim (dia decrescente). */
export function history(progress: PlanProgress, plan: TrainingPlan): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  for (const planDay of plan.days) {
    const completion = progress.completedDays[String(planDay.day)];
    if (completion) entries.push({ day: planDay.day, title: planDay.title, completedAt: completion.completedAt });
  }
  return entries.sort((a, b) => {
    if (a.completedAt && b.completedAt) return b.completedAt.localeCompare(a.completedAt) || b.day - a.day;
    if (a.completedAt) return -1;
    if (b.completedAt) return 1;
    return b.day - a.day;
  });
}

import { isValidISODate } from '../lib/dates';
import type { TrainingPlan } from '../plans/types';
import { DEFAULT_SETTINGS } from './defaults';
import type { DayCompletion, PlanProgress, UserProgressDoc, UserSettings } from './types';

export type ValidationMode = 'load' | 'import';

export type ValidationResult =
  | { ok: true; doc: UserProgressDoc; warnings: string[] }
  | { ok: false; reason: string };

export const STRUCTURE_INVALID = 'Estrutura do arquivo inválida.';
export const START_DATE_INVALID = 'Data de início inválida.';
export const VERSION_UNSUPPORTED = 'Versão de arquivo não suportada.';

/** `${day}:${exerciseId}:${set}` */
export const SET_KEY_RE = /^(\d{1,3}):([a-z0-9_]+):(\d{1,2})$/;
const DAY_KEY_RE = /^\d{1,3}$/;

export function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

const isIsoDateTime = (x: unknown): x is string => typeof x === 'string' && !Number.isNaN(Date.parse(x));

function invalidCountWarning(n: number): string {
  return n === 1 ? '1 registro inválido ignorado' : `${n} registros inválidos ignorados`;
}

class Invalid extends Error {}

function validateSettings(x: unknown, warnings: string[]): UserSettings {
  if (!isPlainObject(x)) {
    warnings.push('Preferências ausentes; usando o padrão.');
    return { ...DEFAULT_SETTINGS };
  }
  const settings = { ...DEFAULT_SETTINGS };
  let fixed = false;
  if (x.equipment === 'bar' || x.equipment === 'none') settings.equipment = x.equipment;
  else fixed = true;
  for (const key of ['showPhotos', 'animateMedia', 'sound'] as const) {
    const value = x[key];
    if (typeof value === 'boolean') settings[key] = value;
    else fixed = true;
  }
  if (fixed) warnings.push('Preferências inválidas substituídas pelo padrão.');
  return settings;
}

/** Validação estrutural de um PlanProgress. Conta entradas descartadas em `dropped`. */
function validatePlanProgress(planId: string, x: unknown, fallbackUpdatedAt: string, dropped: { n: number }): PlanProgress {
  if (!isPlainObject(x)) throw new Invalid(STRUCTURE_INVALID);
  const { startDate, completedDays: rawDays, completedSets: rawSets, updatedAt } = x;
  if (typeof startDate !== 'string' || !isValidISODate(startDate)) throw new Invalid(START_DATE_INVALID);
  if (!isPlainObject(rawDays) || !isPlainObject(rawSets)) throw new Invalid(STRUCTURE_INVALID);

  const completedDays: Record<string, DayCompletion> = {};
  for (const [key, value] of Object.entries(rawDays)) {
    const completedAt = isPlainObject(value) ? value.completedAt : undefined;
    if (completedAt === null || isIsoDateTime(completedAt)) completedDays[key] = { completedAt };
    else dropped.n++;
  }
  const completedSets: Record<string, true> = {};
  for (const [key, value] of Object.entries(rawSets)) {
    if (value === true) completedSets[key] = true;
    else dropped.n++;
  }
  return {
    planId,
    startDate,
    completedDays,
    completedSets,
    updatedAt: isIsoDateTime(updatedAt) ? updatedAt : fallbackUpdatedAt,
  };
}

/** Regras do registry (modo import): só dias/séries que existem no plano. */
function filterByPlan(progress: PlanProgress, plan: TrainingPlan, dropped: { n: number }): PlanProgress {
  const completedDays: Record<string, DayCompletion> = {};
  for (const [key, value] of Object.entries(progress.completedDays)) {
    const day = Number(key);
    if (DAY_KEY_RE.test(key) && Number.isInteger(day) && day >= 1 && day <= plan.durationDays) completedDays[String(day)] = value;
    else dropped.n++;
  }
  const completedSets: Record<string, true> = {};
  for (const key of Object.keys(progress.completedSets)) {
    const m = SET_KEY_RE.exec(key);
    const day = m ? Number(m[1]) : Number.NaN;
    const planDay = Number.isInteger(day) && day >= 1 ? plan.days[day - 1] : undefined;
    const exercise = m && planDay ? planDay.exercises.find((ex) => ex.id === m[2]) : undefined;
    const set = m ? Number(m[3]) : Number.NaN;
    if (exercise && set >= 1 && set <= exercise.sets) completedSets[key] = true;
    else dropped.n++;
  }
  return { ...progress, completedDays, completedSets };
}

/**
 * Valida um UserProgressDoc vindo do repositório (`load`: só estrutura; preserva planos desconhecidos,
 * activePlanId e chaves órfãs) ou de um arquivo importado (`import`: aplica também o registry).
 * O uid do conteúdo é mantido; quem chama regrava com o uid da sessão.
 */
export function validateProgressDoc(
  x: unknown,
  plans: readonly TrainingPlan[],
  options: { mode: ValidationMode },
  now: Date = new Date(),
): ValidationResult {
  const warnings: string[] = [];
  const nowIso = now.toISOString();
  try {
    if (!isPlainObject(x)) throw new Invalid(STRUCTURE_INVALID);
    if (x.schemaVersion !== 1) throw new Invalid(typeof x.schemaVersion === 'number' ? VERSION_UNSUPPORTED : STRUCTURE_INVALID);
    if (typeof x.uid !== 'string') throw new Invalid(STRUCTURE_INVALID);

    let createdAt = nowIso;
    if (typeof x.createdAt === 'string') createdAt = x.createdAt;
    else warnings.push('Data de criação ausente; usando agora.');
    let updatedAt = nowIso;
    if (typeof x.updatedAt === 'string') updatedAt = x.updatedAt;
    else warnings.push('Data de atualização ausente; usando agora.');

    const settings = validateSettings(x.settings, warnings);

    let activePlanId: string | null;
    if (x.activePlanId === null || typeof x.activePlanId === 'string') activePlanId = x.activePlanId;
    else if (x.activePlanId === undefined) {
      activePlanId = null;
      warnings.push('Plano ativo ausente.');
    } else throw new Invalid(STRUCTURE_INVALID);

    if (!isPlainObject(x.plans)) throw new Invalid(STRUCTURE_INVALID);
    const dropped = { n: 0 };
    const planEntries: Record<string, PlanProgress> = {};
    for (const [planId, value] of Object.entries(x.plans)) {
      planEntries[planId] = validatePlanProgress(planId, value, updatedAt, dropped);
    }

    let resultPlans = planEntries;
    if (options.mode === 'import') {
      resultPlans = {};
      for (const [planId, progress] of Object.entries(planEntries)) {
        const plan = plans.find((p) => p.id === planId);
        if (!plan) {
          warnings.push(`Plano desconhecido ignorado: ${planId}`);
          continue;
        }
        resultPlans[planId] = filterByPlan(progress, plan, dropped);
      }
      if (activePlanId !== null && !resultPlans[activePlanId]) {
        warnings.push(`Plano ativo inexistente ignorado: ${activePlanId}`);
        activePlanId = null;
      }
    }
    if (dropped.n > 0) warnings.push(invalidCountWarning(dropped.n));

    return {
      ok: true,
      doc: { schemaVersion: 1, uid: x.uid, activePlanId, plans: resultPlans, settings, createdAt, updatedAt },
      warnings,
    };
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, reason: err.message };
    throw err;
  }
}

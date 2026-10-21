import type { TrainingPlan } from './types';

export const PLAN_ID_RE = /^[a-z0-9-]+$/;
export const EXERCISE_ID_RE = /^[a-z0-9_]+$/;

/**
 * Confere as invariantes dos planos do registry (roda só em DEV). Cada problema vira um console.error
 * com plano/dia/exercício. Retorna a lista de problemas (vazia = tudo certo).
 */
export function validatePlans(plans: readonly TrainingPlan[]): string[] {
  const problems: string[] = [];
  const seenPlanIds = new Set<string>();

  for (const plan of plans) {
    const where = `plano "${plan.id}"`;
    if (seenPlanIds.has(plan.id)) problems.push(`${where}: id de plano repetido`);
    seenPlanIds.add(plan.id);
    if (!PLAN_ID_RE.test(plan.id)) problems.push(`${where}: id fora de /^[a-z0-9-]+$/`);
    if (plan.days.length !== plan.durationDays) {
      problems.push(`${where}: days.length (${plan.days.length}) ≠ durationDays (${plan.durationDays})`);
    }

    const phaseIds = new Set(plan.phases.map((p) => p.id));
    plan.days.forEach((day, index) => {
      const dayWhere = `${where}, dia ${day.day}`;
      if (day.day !== index + 1) problems.push(`${dayWhere}: fora de sequência (esperado ${index + 1})`);
      if (!phaseIds.has(day.phaseId)) problems.push(`${dayWhere}: phaseId "${day.phaseId}" inexistente`);

      const seenExerciseIds = new Set<string>();
      for (const ex of day.exercises) {
        const exWhere = `${dayWhere}, exercício "${ex.id}"`;
        if (seenExerciseIds.has(ex.id)) problems.push(`${exWhere}: id repetido no dia`);
        seenExerciseIds.add(ex.id);
        if (!EXERCISE_ID_RE.test(ex.id)) problems.push(`${exWhere}: id fora de /^[a-z0-9_]+$/`);
        if (!Number.isInteger(ex.sets) || ex.sets < 1) problems.push(`${exWhere}: sets < 1`);
      }
    });
  }

  for (const problem of problems) console.error(`[plans] ${problem}`);
  return problems;
}

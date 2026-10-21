import { splitMuscleGroups, type PlanDay, type PlanPhase, type TrainingPlan } from '../types';
import { PHASE_RULES, phases, type PhaseRule } from './phases';
import { templates, type DayTemplate } from './templates';

const DAYS_PER_WEEK = 7;
/** Domingo (recuperação) tem sempre 2 séries no legado. */
const RECOVERY_SETS = 2;

/**
 * Expande os templates semanais em dias completos: dia d usa a fase ceil(d/7) e o template (d-1)%7.
 * sets = 2 na recuperação, senão o setsCount da fase; restSeconds = restOverride ?? restSeconds da fase.
 */
export function buildDays(
  dayTemplates: DayTemplate[],
  planPhases: PlanPhase[],
  rules: PhaseRule[],
  durationDays: number,
): PlanDay[] {
  const days: PlanDay[] = [];
  for (let d = 1; d <= durationDays; d++) {
    const week = Math.ceil(d / DAYS_PER_WEEK);
    const template = dayTemplates[(d - 1) % dayTemplates.length];
    const phase = planPhases[week - 1];
    const rule = rules[week - 1];
    if (!template || !phase || !rule) throw new Error(`buildDays: dados ausentes para o dia ${d}`);
    const sets = template.kind === 'recovery' ? RECOVERY_SETS : rule.setsCount;
    days.push({
      day: d,
      phaseId: phase.id,
      weekdayLabel: template.weekdayLabel,
      weekdayShort: template.weekdayShort,
      title: template.title,
      subtitle: template.subtitle,
      kind: template.kind,
      exercises: template.exercises.map(({ restOverride, ...ex }) => ({
        ...ex,
        muscleGroups: splitMuscleGroups(ex.muscleGroup),
        sets,
        restSeconds: restOverride ?? rule.restSeconds,
      })),
    });
  }
  return days;
}

const DURATION_DAYS = 28;

const plan: TrainingPlan = {
  id: 'calistenia-28',
  order: 1,
  name: 'Protocolo 28 Dias de Calistenia',
  tagline: 'Desafio Espartano • Sparta 28 Dias',
  description:
    'Quatro semanas de calistenia progressiva: adaptação e técnica, volume e resistência, densidade metabólica em circuito e o Spartan Peak. Treinos de empurrar, pernas, puxar + core, HIIT, full body, desafio por tempo e mobilidade.',
  durationDays: DURATION_DAYS,
  level: 'todos',
  levelLabel: 'Iniciante a avançado',
  equipmentLabel: 'Peso corporal • barra opcional',
  coverEmoji: '⚔️',
  mediaBaseUrl: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises',
  phases,
  days: buildDays(templates, phases, PHASE_RULES, DURATION_DAYS),
};

export default plan;

export type Equipment = 'bar' | 'none';
export type PlanLevel = 'iniciante' | 'intermediario' | 'avancado' | 'todos';
export type ExerciseCategory = 'peito' | 'costas' | 'pernas' | 'core';
export type AnatomyType = 'pushup' | 'pike' | 'dips' | 'squat' | 'pullup' | 'core' | 'default';
export type ExerciseTimer = { kind: 'countdown'; seconds: number } | { kind: 'stopwatch' };

export interface ExerciseVariant {
  name: string;
  mediaId: string;
  timer?: ExerciseTimer;
}

export interface Exercise {
  /** Id do slot (único no dia), ex.: 'pushup_std'. Formato /^[a-z0-9_]+$/ (parte da chave de série salva). */
  id: string;
  /** Nome padrão (= variante 'bar' quando há variantes). */
  name: string;
  /** Id no free-exercise-db. */
  mediaId: string;
  /** Presente só nos exercícios que mudam com o equipamento. */
  variants?: Record<Equipment, ExerciseVariant>;
  category: ExerciseCategory;
  /** Texto literal do legado (exibido). */
  muscleGroup: string;
  /** muscleGroup.split('•').map(trim).filter(Boolean) (chips/busca). */
  muscleGroups: string[];
  /** "Meta" literal (repsBase do legado). */
  target: string;
  sets: number;
  restSeconds: number;
  /** Passos literais. */
  instructions: string[];
  /** Busca do YouTube (ytQuery do legado). */
  videoQuery?: string;
  anatomy: AnatomyType;
  /** Atalho de cronômetro no card (exercícios sem variantes). */
  timer?: ExerciseTimer;
}

export interface PlanPhase {
  id: string;
  name: string;
  shortName: string;
  rulesTitle: string;
  dayRange: [number, number];
  description: string;
  format: string;
  setsLabel: string;
  restLabel: string;
  tempo: string;
}

export type PlanDayKind = 'training' | 'challenge' | 'recovery' | 'hiit';

export interface PlanDay {
  day: number;
  phaseId: string;
  weekdayLabel: string;
  weekdayShort: string;
  title: string;
  subtitle: string;
  kind: PlanDayKind;
  exercises: Exercise[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  tagline: string;
  description: string;
  durationDays: number;
  level: PlanLevel;
  levelLabel: string;
  equipmentLabel: string;
  coverEmoji: string;
  phases: PlanPhase[];
  days: PlanDay[];
  mediaBaseUrl?: string;
  /** Ordenação na tela Planos (menor primeiro; ausente = 99). */
  order?: number;
}

export interface UpcomingPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  levelLabel: string;
  coverEmoji: string;
}

export interface ResolvedExercise {
  name: string;
  mediaId: string;
  timer?: ExerciseTimer;
}

/**
 * Aplica a variante do equipamento quando existe (equivale a `(useBar ? nameBar : nameNoEquip) || name` do legado).
 * Regra do timer: com variantes vale só o timer da variante; sem variantes, o do exercício.
 */
export function resolveExercise(ex: Exercise, equipment: Equipment): ResolvedExercise {
  const variant = ex.variants?.[equipment];
  const timer = ex.variants ? ex.variants[equipment].timer : ex.timer;
  return {
    name: variant?.name ?? ex.name,
    mediaId: variant?.mediaId ?? ex.mediaId,
    timer,
  };
}

/** Divide o texto de grupos musculares do legado em chips limpos. */
export function splitMuscleGroups(muscleGroup: string): string[] {
  return muscleGroup
    .split('•')
    .map((part) => part.trim())
    .filter(Boolean);
}

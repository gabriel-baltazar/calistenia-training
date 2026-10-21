import type { PlanProgress, UserProgressDoc, UserSettings } from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  equipment: 'bar',
  showPhotos: true,
  animateMedia: true,
  sound: true,
};

/** Doc vazio (sem plano ativo). Só é salvo na primeira mutação. */
export function createEmptyDoc(uid: string, now: Date = new Date()): UserProgressDoc {
  const iso = now.toISOString();
  return {
    schemaVersion: 1,
    uid,
    activePlanId: null,
    plans: {},
    settings: { ...DEFAULT_SETTINGS },
    createdAt: iso,
    updatedAt: iso,
  };
}

export function createPlanProgress(planId: string, startDate: string, now: Date = new Date()): PlanProgress {
  return {
    planId,
    startDate,
    completedDays: {},
    completedSets: {},
    updatedAt: now.toISOString(),
  };
}

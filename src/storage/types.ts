import type { Equipment } from '../plans/types';

export interface UserSettings {
  equipment: Equipment;
  showPhotos: boolean;
  animateMedia: boolean;
  sound: boolean;
}

export interface DayCompletion {
  /** ISO 8601; null = importado do app antigo (sem data). */
  completedAt: string | null;
}

export interface PlanProgress {
  planId: string;
  /** 'AAAA-MM-DD' (data local). */
  startDate: string;
  /** Chave: número do dia ('1'..'N'). */
  completedDays: Record<string, DayCompletion>;
  /** Chave: `${day}:${exerciseId}:${set}` (set 1-based); desmarcar = apagar a chave. */
  completedSets: Record<string, true>;
  updatedAt: string;
}

export interface UserProgressDoc {
  schemaVersion: 1;
  uid: string;
  activePlanId: string | null;
  /** Por planId: trocar de plano preserva o progresso. */
  plans: Record<string, PlanProgress>;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

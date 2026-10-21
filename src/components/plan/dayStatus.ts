import { isDayDone } from '../../progress/selectors';
import type { PlanProgress } from '../../storage/types';

export type DayStatus = 'done' | 'today' | 'pending' | 'future';

/** done > today > pending (antes de hoje, não concluído) > future. */
export function dayStatus(progress: PlanProgress, day: number, today: number): DayStatus {
  if (isDayDone(progress, day)) return 'done';
  if (day === today) return 'today';
  return day < today ? 'pending' : 'future';
}

import type { PlanDay } from '../../plans/types';
import type { PlanProgress } from '../../storage/types';
import { DayCell } from './DayCell';
import { dayStatus } from './dayStatus';
import s from './WeekStrip.module.css';

export interface WeekStripProps {
  days: PlanDay[];
  progress: PlanProgress;
  /** Dia do plano correspondente a hoje. */
  today: number;
  onSelect: (day: number) => void;
}

/** 7 DayCells numa linha. */
export function WeekStrip({ days, progress, today, onSelect }: WeekStripProps) {
  return (
    <div className={s.strip}>
      {days.map((d) => (
        <DayCell
          key={d.day}
          day={d.day}
          weekdayShort={d.weekdayShort}
          weekdayLabel={d.weekdayLabel}
          status={dayStatus(progress, d.day, today)}
          onClick={() => onSelect(d.day)}
          size="sm"
        />
      ))}
    </div>
  );
}

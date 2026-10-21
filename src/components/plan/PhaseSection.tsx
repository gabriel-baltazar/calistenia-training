import { isDayDone } from '../../progress/selectors';
import type { PlanDay, PlanPhase } from '../../plans/types';
import type { PlanProgress } from '../../storage/types';
import { Card } from '../ui/Card';
import { DayCell } from './DayCell';
import { dayStatus } from './dayStatus';
import s from './PhaseSection.module.css';

export interface PhaseSectionProps {
  phase: PlanPhase;
  days: PlanDay[];
  progress: PlanProgress;
  today: number;
  onSelect: (day: number) => void;
}

/** Fase do calendário: nome, faixa de dias, "{feitos}/{n} concluídos" e a grade de DayCells. */
export function PhaseSection({ phase, days, progress, today, onSelect }: PhaseSectionProps) {
  const done = days.filter((d) => isDayDone(progress, d.day)).length;
  const [first, last] = phase.dayRange;
  return (
    <Card as="section" padding="md" className={s.section} aria-label={phase.name}>
      <header className={s.header}>
        <div>
          <h3 className={s.title}>{phase.name}</h3>
          <p className={s.range}>
            Dias {first} a {last}
          </p>
        </div>
        <span className={s.count}>
          <span className="num">
            {done}/{days.length}
          </span>{' '}
          concluídos
        </span>
      </header>
      <div className={s.grid}>
        {days.map((d) => (
          <DayCell
            key={d.day}
            day={d.day}
            weekdayShort={d.weekdayShort}
            weekdayLabel={d.weekdayLabel}
            status={dayStatus(progress, d.day, today)}
            onClick={() => onSelect(d.day)}
          />
        ))}
      </div>
    </Card>
  );
}

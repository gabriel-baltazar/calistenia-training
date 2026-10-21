import { Check } from 'lucide-react';
import { cx } from '../../lib/cx';
import type { DayStatus } from './dayStatus';
import s from './DayCell.module.css';

export interface DayCellProps {
  day: number;
  weekdayShort: string;
  /** Ex.: "Quinta-feira" → rótulo acessível "Dia 4, quinta, concluído". */
  weekdayLabel: string;
  status: DayStatus;
  selected?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}

const STATUS_LABEL: Record<DayStatus, string> = {
  done: 'concluído',
  today: 'hoje',
  pending: 'não concluído',
  future: 'a seguir',
};

export function DayCell({ day, weekdayShort, weekdayLabel, status, selected, onClick, size = 'md' }: DayCellProps) {
  const weekday = (weekdayLabel.split('-')[0] ?? weekdayLabel).toLowerCase();
  return (
    <button
      type="button"
      className={cx(s.cell, s[size], s[status], selected && s.selected)}
      onClick={onClick}
      aria-label={`Dia ${day}, ${weekday}, ${STATUS_LABEL[status]}`}
      aria-current={status === 'today' ? 'date' : undefined}
    >
      <span className={s.weekday}>{weekdayShort}</span>
      <span className={cx(s.day, 'num')}>{day}</span>
      <span className={s.mark} aria-hidden="true">
        {status === 'done' && <Check size={size === 'sm' ? 12 : 14} strokeWidth={3} />}
      </span>
    </button>
  );
}

import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './StatTile.module.css';

export interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: 'primary' | 'success' | 'danger';
  className?: string;
}

export function StatTile({ icon, label, value, unit, tone = 'primary', className }: StatTileProps) {
  return (
    <div className={cx(s.tile, className)}>
      <span className={cx(s.icon, s[tone])} aria-hidden="true">
        {icon}
      </span>
      <div className={s.text}>
        <span className={s.label}>{label}</span>
        <span className={s.value}>
          <span className="num">{value}</span>
          {unit && <span className={s.unit}> {unit}</span>}
        </span>
      </div>
    </div>
  );
}

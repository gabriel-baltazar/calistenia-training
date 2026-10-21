import { useId, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { cx } from '../../lib/cx';
import { useMotionInitial } from '../../design/motionStatus';
import s from './ProgressRing.module.css';

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
  sublabel?: string;
  tone?: 'primary' | 'success';
  ariaLabel: string;
  className?: string;
}

export function ProgressRing({ value, size = 120, stroke = 10, label, sublabel, tone = 'primary', ariaLabel, className }: ProgressRingProps) {
  const gradientId = useId();
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  // Começa vazio só quando as features do Framer já chegaram; senão nasce no valor final.
  const initial = useMotionInitial({ strokeDashoffset: c });

  return (
    <div className={cx(s.ring, className)} style={{ width: size, height: size }} role="img" aria-label={ariaLabel}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {tone === 'success' ? (
              <>
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="100%" stopColor="#16A34A" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="45%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle className={s.track} cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={initial}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ opacity: clamped === 0 ? 0 : 1 }}
        />
      </svg>
      {(label !== undefined || sublabel) && (
        <div className={s.center} aria-hidden="true">
          {label !== undefined && <span className={cx(s.label, 'num')}>{label}</span>}
          {sublabel && <span className={s.sublabel}>{sublabel}</span>}
        </div>
      )}
    </div>
  );
}

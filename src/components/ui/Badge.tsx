import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './Badge.module.css';

export interface BadgeProps {
  tone?: 'neutral' | 'primary' | 'success' | 'danger';
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return <span className={cx(s.badge, s[tone], className)}>{children}</span>;
}

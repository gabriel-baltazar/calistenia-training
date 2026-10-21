import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './Chip.module.css';

export interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children: ReactNode;
}

/** Clicável → <button aria-pressed>; senão → <span>. */
export function Chip({ selected = false, onClick, icon, disabled, size = 'md', className, children }: ChipProps) {
  const classes = cx(s.chip, s[size], selected && s.selected, onClick && s.clickable, className);
  const content = (
    <>
      {icon && (
        <span className={s.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </>
  );
  if (!onClick) return <span className={classes}>{content}</span>;
  return (
    <button type="button" className={classes} aria-pressed={selected} disabled={disabled} onClick={onClick}>
      {content}
    </button>
  );
}

import { useId, useState, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './Tooltip.module.css';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

/**
 * O gatilho é o wrapper focável (span tabIndex=0), não o filho: um botão desabilitado
 * não emite eventos de mouse/foco.
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className={cx(s.wrapper, className)}
      tabIndex={0}
      aria-describedby={id}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
      onTouchStart={() => setOpen((v) => !v)}
    >
      {children}
      <span id={id} role="tooltip" className={cx(s.tip, open && s.open)}>
        {content}
      </span>
    </span>
  );
}

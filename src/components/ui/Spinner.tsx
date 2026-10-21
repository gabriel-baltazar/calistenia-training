import { cx } from '../../lib/cx';
import s from './Spinner.module.css';

export interface SpinnerProps {
  size?: number;
  className?: string;
}

/** Decorativo (aria-hidden): quem usa anuncia o estado com aria-busy/texto. */
export function Spinner({ size = 20, className }: SpinnerProps) {
  return <span className={cx(s.spinner, className)} style={{ width: size, height: size }} aria-hidden="true" />;
}

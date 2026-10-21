import { m } from 'framer-motion';
import { Check } from 'lucide-react';
import { cx } from '../../lib/cx';
import { pop } from '../../design/motion';
import s from './SetToggle.module.css';

export interface SetToggleProps {
  set: number;
  done: boolean;
  exerciseName: string;
  onToggle: () => void;
}

/** Círculo de 44 px por série ("1ª", "2ª"…); feito = verde com ✓ e pulso `pop`. */
export function SetToggle({ set, done, exerciseName, onToggle }: SetToggleProps) {
  return (
    <m.button
      type="button"
      className={cx(s.toggle, done && s.done)}
      aria-pressed={done}
      aria-label={`Série ${set} de ${exerciseName}`}
      onClick={onToggle}
      animate={done ? pop : { scale: 1 }}
    >
      {done ? <Check size={20} strokeWidth={3} aria-hidden="true" /> : <span className="num">{set}ª</span>}
    </m.button>
  );
}

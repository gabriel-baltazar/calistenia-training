import { useId } from 'react';
import { cx } from '../../lib/cx';
import s from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  const labelId = useId();
  const descId = useId();
  return (
    <div className={cx(s.row, disabled && s.disabled, className)}>
      <span className={s.text}>
        <span id={labelId} className={s.label}>
          {label}
        </span>
        {description && (
          <span id={descId} className={s.description}>
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        className={cx(s.track, checked && s.on)}
        onClick={() => onChange(!checked)}
      >
        <span className={s.thumb} aria-hidden="true" />
      </button>
    </div>
  );
}

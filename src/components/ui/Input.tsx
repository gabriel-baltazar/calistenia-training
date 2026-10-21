import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cx } from '../../lib/cx';
import s from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, type = 'text', id, className, 'aria-describedby': describedBy, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-erro`;
  const hintId = `${inputId}-dica`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const describedByIds = cx(describedBy, error && errorId, hint && hintId) || undefined;

  return (
    <div className={cx(s.field, className)}>
      <label className={s.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={cx(s.control, error && s.invalid)}>
        {leftIcon && (
          <span className={s.leftIcon} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          className={s.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className={s.toggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            aria-controls={inputId}
          >
            {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className={s.error}>
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={s.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});

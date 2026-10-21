import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { m, type HTMLMotionProps } from 'framer-motion';
import { cx } from '../../lib/cx';
import { Spinner } from './Spinner';
import s from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>;

export interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, loading, leftIcon, rightIcon, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <m.button
      ref={ref}
      type={type}
      className={cx(s.button, s[variant], s[size], fullWidth && s.full, className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      {...(rest as HTMLMotionProps<'button'>)}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 18} /> : leftIcon && <span className={s.icon}>{leftIcon}</span>}
      {children !== undefined && <span className={s.label}>{children}</span>}
      {!loading && rightIcon && <span className={s.icon}>{rightIcon}</span>}
    </m.button>
  );
});

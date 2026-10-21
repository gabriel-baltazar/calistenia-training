import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './SegmentedControl.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** radiogroup com navegação por setas (roving tabindex). */
export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, className }: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const current = Math.max(0, options.findIndex((o) => o.value === value));
    const nextIndex = (current + delta + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    onChange(next.value);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cx(s.group, className)} onKeyDown={onKeyDown}>
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(s.option, selected && s.selected)}
            onClick={() => onChange(option.value)}
          >
            {option.icon && (
              <span className={s.icon} aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span className={s.label}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

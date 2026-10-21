import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import s from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  children?: ReactNode;
}

export function Card({ as: Tag = 'div', padding = 'md', interactive, className, ...rest }: CardProps) {
  return <Tag className={cx(s.card, s[`p-${padding}`], interactive && s.interactive, className)} {...rest} />;
}

export interface GlassCardProps extends CardProps {
  strong?: boolean;
}

/** Vidro: compõe as classes globais .glass/.glass-strong (únicas com backdrop-filter). */
export function GlassCard({ as: Tag = 'div', padding = 'md', interactive, strong, className, ...rest }: GlassCardProps) {
  return (
    <Tag
      className={cx(strong ? 'glass-strong' : 'glass', s.glass, s[`p-${padding}`], interactive && s.interactive, className)}
      {...rest}
    />
  );
}

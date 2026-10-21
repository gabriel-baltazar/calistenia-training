import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cx } from '../../lib/cx';
import s from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Rota de volta; mostra o botão "Voltar". */
  back?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, back, actions, className }: PageHeaderProps) {
  return (
    <header className={cx(s.header, className)}>
      {back && (
        <Link to={back} className={s.back} aria-label="Voltar">
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>
      )}
      <div className={s.text}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
}

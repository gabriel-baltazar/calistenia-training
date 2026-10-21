import { Link, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import { BookOpen, CalendarDays, Dumbbell, Home, User, type LucideIcon } from 'lucide-react';
import { cx } from '../../lib/cx';
import { useProgress } from '../../progress/ProgressProvider';
import { activePlanProgress, todayDay } from '../../progress/selectors';
import { getPlan } from '../../plans/registry';
import s from './BottomNav.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

function isActive(item: NavItem, pathname: string): boolean {
  if (item.match) return item.match(pathname);
  if (item.to === '/') return pathname === '/';
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** 5 itens; "Treino" aponta direto para o dia de hoje (ou para Planos sem plano ativo). */
export function BottomNav() {
  const { pathname } = useLocation();
  const { doc } = useProgress();
  const plan = getPlan(doc.activePlanId);
  const progress = plan ? activePlanProgress(doc) : null;
  const workoutTo = plan && progress ? `/treino/${todayDay(progress, plan)}` : '/planos';

  const items: NavItem[] = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/plano', label: 'Plano', icon: CalendarDays },
    { to: workoutTo, label: 'Treino', icon: Dumbbell, match: (p) => p.startsWith('/treino') },
    { to: '/biblioteca', label: 'Biblioteca', icon: BookOpen },
    { to: '/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <nav className={cx('glass-strong', s.nav)} aria-label="Navegação principal">
      <div className={s.brand} aria-hidden="true">
        <span className={s.logo}>⚔️</span>
        <span className={s.brandName}>Sparta 28</span>
      </div>
      <ul className={s.list}>
        {items.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.label} className={s.li}>
              <Link to={item.to} className={cx(s.item, active && s.active)} aria-current={active ? 'page' : undefined}>
                {active && (
                  <m.span
                    layoutId="nav-pill"
                    className={s.pill}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    aria-hidden="true"
                  />
                )}
                <Icon size={22} className={s.icon} aria-hidden="true" />
                <span className={s.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

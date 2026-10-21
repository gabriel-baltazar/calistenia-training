import { Spinner } from '../ui/Spinner';
import s from './Splash.module.css';

export function Splash() {
  return (
    <div className={s.splash} role="status" aria-live="polite" aria-busy="true">
      <span className={s.logo} aria-hidden="true">
        ⚔️
      </span>
      <span className={s.brand}>Sparta 28</span>
      <Spinner size={24} className={s.spinner} />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

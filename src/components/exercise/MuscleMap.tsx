import { cx } from '../../lib/cx';
import s from './MuscleMap.module.css';

/** Mapa muscular frontal e dorsal (porte 1:1 de L275–L327 do legado). */
export function MuscleMap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 220" className={cx(s.svg, className)} role="img" aria-label="Músculos ativados: visão frontal e dorsal">
      {/* FRONTAL */}
      <g transform="translate(25, 10)">
        <text x="45" y="12" fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">
          ANTERIOR (FRENTE)
        </text>
        {/* Cabeça */}
        <circle cx="45" cy="30" r="11" fill="#374151" stroke="#6b7280" strokeWidth="1.5" />
        {/* Ombros (Deltoides) */}
        <ellipse cx="23" cy="52" rx="7" ry="9" fill="#f97316" className={s.muscle} />
        <ellipse cx="67" cy="52" rx="7" ry="9" fill="#f97316" className={s.muscle} />
        {/* Peitoral */}
        <path d="M 30 45 Q 45 50 44 64 L 29 62 Z" fill="#ea580c" className={s.muscle} />
        <path d="M 60 45 Q 45 50 46 64 L 61 62 Z" fill="#ea580c" className={s.muscle} />
        {/* Abdômen (Core 6-pack) */}
        <rect x="36" y="66" width="8" height="7" rx="1.5" fill="#f97316" />
        <rect x="46" y="66" width="8" height="7" rx="1.5" fill="#f97316" />
        <rect x="36" y="75" width="8" height="7" rx="1.5" fill="#f97316" />
        <rect x="46" y="75" width="8" height="7" rx="1.5" fill="#f97316" />
        <rect x="36" y="84" width="8" height="7" rx="1.5" fill="#fb923c" />
        <rect x="46" y="84" width="8" height="7" rx="1.5" fill="#fb923c" />
        {/* Braços / Bíceps */}
        <rect x="16" y="60" width="9" height="28" rx="4" fill="#fb923c" />
        <rect x="65" y="60" width="9" height="28" rx="4" fill="#fb923c" />
        {/* Antebraços */}
        <rect x="13" y="90" width="8" height="24" rx="3" fill="#4b5563" />
        <rect x="69" y="90" width="8" height="24" rx="3" fill="#4b5563" />
        {/* Quadríceps */}
        <path d="M 31 96 L 43 96 L 41 142 L 29 142 Z" fill="#f97316" className={s.muscle} />
        <path d="M 47 96 L 59 96 L 61 142 L 49 142 Z" fill="#f97316" className={s.muscle} />
        {/* Canelas */}
        <rect x="30" y="146" width="9" height="36" rx="4" fill="#4b5563" />
        <rect x="51" y="146" width="9" height="36" rx="4" fill="#4b5563" />
      </g>

      {/* DORSAL (COSTAS) */}
      <g transform="translate(145, 10)">
        <text x="45" y="12" fill="#9ca3af" fontSize="9" fontWeight="bold" textAnchor="middle">
          POSTERIOR (COSTAS)
        </text>
        <circle cx="45" cy="30" r="11" fill="#374151" stroke="#6b7280" strokeWidth="1.5" />
        {/* Trapézio e Dorsal (Asa) */}
        <polygon points="28,44 62,44 56,88 34,88" fill="#ea580c" className={s.muscle} />
        {/* Tríceps */}
        <rect x="16" y="56" width="9" height="30" rx="4" fill="#f97316" />
        <rect x="65" y="56" width="9" height="30" rx="4" fill="#f97316" />
        {/* Glúteos */}
        <ellipse cx="38" cy="98" rx="8" ry="9" fill="#f97316" />
        <ellipse cx="52" cy="98" rx="8" ry="9" fill="#f97316" />
        {/* Posteriores (Isquiotibiais) */}
        <rect x="31" y="109" width="10" height="32" rx="4" fill="#fb923c" />
        <rect x="49" y="109" width="10" height="32" rx="4" fill="#fb923c" />
        {/* Panturrilhas */}
        <ellipse cx="35" cy="156" rx="5.5" ry="13" fill="#f97316" className={s.muscle} />
        <ellipse cx="55" cy="156" rx="5.5" ry="13" fill="#f97316" className={s.muscle} />
      </g>
    </svg>
  );
}

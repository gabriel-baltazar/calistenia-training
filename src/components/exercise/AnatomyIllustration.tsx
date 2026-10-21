import { useId, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { AnatomyType } from '../../plans/types';
import s from './AnatomyIllustration.module.css';

export interface AnatomyIllustrationProps {
  type: AnatomyType;
  className?: string;
}

// Rótulo acessível = texto principal de cada tipo (literal do legado, extract §2.9).
const LABELS: Record<AnatomyType, string> = {
  pushup: 'PEITORAL • TRÍCEPS • CORE',
  pike: 'DELTOIDES (OMBROS EM V)',
  dips: 'TRÍCEPS • PEITORAL INFERIOR',
  squat: 'QUADRÍCEPS • GLÚTEOS',
  pullup: 'GRANDE DORSAL • BÍCEPS',
  core: 'RETOS ABDOMINAIS • CORE',
  default: 'CONDICIONAMENTO FULL BODY',
};

/** Corpo do switch de L447–L553 do legado, portado 1:1 (atributos em camelCase). */
function body(type: AnatomyType, arrow: string): ReactNode {
  switch (type) {
    case 'pushup':
      return (
        <>
          {/* Seta de movimento vertical */}
          <line x1="95" y1="36" x2="95" y2="66" stroke="#10b981" strokeWidth="2.5" markerEnd={arrow} markerStart={arrow} className={s.arrow} />
          {/* Posição fantasma (baixa) */}
          <path d="M 28 110 L 82 94 L 128 86" stroke="#374151" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.45" />
          {/* Pernas e Core preenchidos */}
          <path d="M 28 108 L 76 82" stroke="#64748b" strokeWidth="10" strokeLinecap="round" />
          {/* Tronco + Peitoral/Ombro destacado em laranja */}
          <path d="M 76 82 L 126 56" stroke="#f97316" strokeWidth="13" strokeLinecap="round" className={s.muscle} />
          {/* Cabeça anatômica */}
          <circle cx="138" cy="50" r="9" fill="#e2e8f0" />
          {/* Braço e Tríceps ativo */}
          <path d="M 122 58 L 116 84 L 122 112" stroke="#f97316" strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Pés */}
          <circle cx="25" cy="110" r="4.5" fill="#94a3b8" />
          <text x="14" y="20" fill="#f97316" fontSize="8.5" fontWeight="800">
            PEITORAL • TRÍCEPS • CORE
          </text>
          <text x="14" y="31" fill="#94a3b8" fontSize="7.5" fontWeight="600">
            Corpo 100% alinhado em prancha
          </text>
        </>
      );

    case 'pike':
      return (
        <>
          <line x1="126" y1="45" x2="138" y2="75" stroke="#10b981" strokeWidth="2.5" markerEnd={arrow} className={s.arrow} />
          {/* Pernas em V invertido */}
          <path d="M 34 112 L 78 44" stroke="#64748b" strokeWidth="10" strokeLinecap="round" />
          {/* Tronco e Ombros destacados */}
          <path d="M 78 44 L 118 82" stroke="#f97316" strokeWidth="12" strokeLinecap="round" className={s.muscle} />
          <circle cx="123" cy="91" r="8.5" fill="#e2e8f0" />
          {/* Braços empurrando */}
          <path d="M 114 78 L 128 112" stroke="#f97316" strokeWidth="7" strokeLinecap="round" />
          <text x="14" y="20" fill="#f97316" fontSize="8.5" fontWeight="800">
            DELTOIDES (OMBROS EM V)
          </text>
          <text x="14" y="31" fill="#94a3b8" fontSize="7.5" fontWeight="600">
            Topo da cabeça desce à frente das mãos
          </text>
        </>
      );

    case 'dips':
      return (
        <>
          {/* Banco de apoio */}
          <rect x="26" y="72" width="38" height="40" rx="4" fill="#1e2433" stroke="#475569" strokeWidth="2" />
          <line x1="115" y1="42" x2="115" y2="76" stroke="#10b981" strokeWidth="2.5" markerEnd={arrow} markerStart={arrow} className={s.arrow} />
          {/* Cabeça */}
          <circle cx="84" cy="36" r="8.5" fill="#e2e8f0" />
          {/* Tronco vertical */}
          <path d="M 84 48 L 84 84" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" />
          {/* Tríceps e Ombro destacados */}
          <path d="M 82 52 L 62 64 L 62 74" stroke="#f97316" strokeWidth="7.5" strokeLinecap="round" fill="none" className={s.muscle} />
          {/* Pernas à frente */}
          <path d="M 84 84 L 118 86 L 132 112" stroke="#64748b" strokeWidth="9" strokeLinecap="round" fill="none" />
          <text x="14" y="20" fill="#f97316" fontSize="8.5" fontWeight="800">
            TRÍCEPS • PEITORAL INFERIOR
          </text>
        </>
      );

    case 'squat':
      return (
        <>
          {/* Seta de descida/subida */}
          <line x1="42" y1="45" x2="42" y2="85" stroke="#10b981" strokeWidth="2.5" markerEnd={arrow} markerStart={arrow} className={s.arrow} />
          {/* Cabeça */}
          <circle cx="88" cy="32" r="8.5" fill="#e2e8f0" />
          {/* Tronco firme */}
          <path d="M 88 43 L 72 74" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" />
          {/* Braços à frente */}
          <path d="M 84 48 L 118 48" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
          {/* Quadríceps e Glúteos em Laranja */}
          <path d="M 72 74 L 98 76" stroke="#f97316" strokeWidth="12" strokeLinecap="round" className={s.muscle} />
          {/* Canelas */}
          <path d="M 98 76 L 92 112" stroke="#64748b" strokeWidth="8.5" strokeLinecap="round" />
          <text x="14" y="20" fill="#f97316" fontSize="8.5" fontWeight="800">
            QUADRÍCEPS • GLÚTEOS
          </text>
          <text x="14" y="31" fill="#94a3b8" fontSize="7.5" fontWeight="600">
            Desça até quebrar 90° nos joelhos
          </text>
        </>
      );

    case 'pullup':
      return (
        <>
          {/* Barra Fixa */}
          <line x1="35" y1="22" x2="145" y2="22" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <line x1="132" y1="42" x2="132" y2="78" stroke="#10b981" strokeWidth="2.5" markerEnd={arrow} markerStart={arrow} className={s.arrow} />
          {/* Braços puxando */}
          <path d="M 68 22 L 74 44 L 84 48" stroke="#f97316" strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <path d="M 112 22 L 106 44 L 96 48" stroke="#f97316" strokeWidth="6.5" strokeLinecap="round" fill="none" />
          {/* Cabeça */}
          <circle cx="90" cy="36" r="8.5" fill="#e2e8f0" />
          {/* Grande Dorsal em V destacada */}
          <polygon points="75,46 105,46 96,82 84,82" fill="#f97316" className={s.muscle} />
          {/* Pernas */}
          <path d="M 86 82 L 85 110 M 94 82 L 95 110" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
          <text x="14" y="16" fill="#f97316" fontSize="8.5" fontWeight="800">
            GRANDE DORSAL • BÍCEPS
          </text>
        </>
      );

    case 'core':
      return (
        <>
          <line x1="90" y1="52" x2="90" y2="78" stroke="#10b981" strokeWidth="2.5" markerEnd={arrow} className={s.arrow} />
          {/* Pernas elevadas */}
          <path d="M 92 98 L 142 66" stroke="#64748b" strokeWidth="9" strokeLinecap="round" />
          {/* Abdômen contraído no centro */}
          <path d="M 52 72 Q 90 112 96 98" stroke="#f97316" strokeWidth="13" strokeLinecap="round" fill="none" className={s.muscle} />
          <circle cx="44" cy="64" r="8.5" fill="#e2e8f0" />
          <text x="14" y="20" fill="#f97316" fontSize="8.5" fontWeight="800">
            RETOS ABDOMINAIS • CORE
          </text>
          <text x="14" y="31" fill="#94a3b8" fontSize="7.5" fontWeight="600">
            Lombar firme sem perder tensão
          </text>
        </>
      );

    default:
      return (
        <>
          <circle cx="90" cy="34" r="8.5" fill="#e2e8f0" />
          <path d="M 90 45 L 90 80" stroke="#f97316" strokeWidth="12" strokeLinecap="round" className={s.muscle} />
          <path d="M 90 80 L 76 110 M 90 80 L 104 110" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
          <text x="14" y="20" fill="#f97316" fontSize="8.5" fontWeight="800">
            CONDICIONAMENTO FULL BODY
          </text>
        </>
      );
  }
}

/**
 * Ilustração anatômica vetorial (porte 1:1 de L436–L554 do legado). O marker da seta é declarado uma vez
 * por instância, com id gerado por useId() (sem `:`, que quebra o `url(#…)`), para não colidir entre cards.
 */
export function AnatomyIllustration({ type, className }: AnatomyIllustrationProps) {
  const markerId = `arrowHead-${useId().replace(/:/g, '')}`;
  const arrow = `url(#${markerId})`;
  return (
    <svg viewBox="0 0 180 135" className={cx(s.svg, className)} role="img" aria-label={LABELS[type]}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
        </marker>
      </defs>
      {/* Linha de solo */}
      <line x1="15" y1="114" x2="165" y2="114" stroke="#262b38" strokeWidth="3" strokeLinecap="round" />
      {body(type, arrow)}
    </svg>
  );
}

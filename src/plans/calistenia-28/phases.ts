import type { PlanPhase } from '../types';

// Textos literais do legado: weeksConfig (L558–L595) e a aba "Como Funciona a Progressão de 28 Dias" (L334–L353).
export const phases: PlanPhase[] = [
  {
    id: 'semana-1',
    name: 'Semana 1 • Adaptação e Técnica',
    shortName: 'Semana 1',
    rulesTitle: 'Semana 1 (Dias 1 a 7): Adaptação e Técnica Limpa',
    dayRange: [1, 7],
    description:
      '3 a 4 séries tradicionais com 60s de descanso. Foco em aprender a trajetória completa olhando os GIFs reais.',
    format: 'Séries Tradicionais',
    setsLabel: '3 a 4 Séries',
    restLabel: '60 segundos',
    tempo: 'Descida 2s • Subida Forte',
  },
  {
    id: 'semana-2',
    name: 'Semana 2 • Volume e Resistência',
    shortName: 'Semana 2',
    rulesTitle: 'Semana 2 (Dias 8 a 14): Volume e Resistência',
    dayRange: [8, 14],
    description: '4 séries obrigatórias com descanso reduzido para 45s e descida controlada em 3 segundos.',
    format: 'Aumento de Volume',
    setsLabel: '4 Séries Completas',
    restLabel: '45 segundos',
    tempo: 'Descida 3s • Subida Explosiva',
  },
  {
    id: 'semana-3',
    name: 'Semana 3 • Densidade Metabólica',
    shortName: 'Semana 3',
    rulesTitle: 'Semana 3 (Dias 15 a 21): Densidade Metabólica (Circuito)',
    dayRange: [15, 21],
    description:
      'Faça um exercício após o outro com apenas 30s de transição. 4 voltas completas na sequência do dia.',
    format: 'Circuito Sem Pausa',
    setsLabel: '4 Voltas no Circuito',
    restLabel: '30s entre ex. / 90s volta',
    tempo: 'Ritmo Contínuo Forte',
  },
  {
    id: 'semana-4',
    name: 'Semana 4 • Spartan Peak (Exaustão)',
    shortName: 'Semana 4',
    rulesTitle: 'Semana 4 (Dias 22 a 28): Spartan Peak (Exaustão)',
    dayRange: [22, 28],
    description: '5 voltas de intensidade máxima com pausas curtas de 20s buscando a falha técnica limpa.',
    format: '5 Voltas • Até a Falha',
    setsLabel: '5 Séries / Voltas',
    restLabel: '20s entre ex. / 60s volta',
    tempo: 'Máxima Intensidade',
  },
];

export interface PhaseRule {
  setsCount: number;
  restSeconds: number;
}

/** setsCount/restSeconds de cada semana (weeksConfig do legado), na ordem das fases. */
export const PHASE_RULES: PhaseRule[] = [
  { setsCount: 3, restSeconds: 60 },
  { setsCount: 4, restSeconds: 45 },
  { setsCount: 4, restSeconds: 30 },
  { setsCount: 5, restSeconds: 20 },
];

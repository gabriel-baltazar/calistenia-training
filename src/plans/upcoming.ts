import type { UpcomingPlan } from './types';

/** Planos "Em breve": só exibição (card desabilitado). Fica fora do glob do registry de propósito. */
export const upcomingPlans: readonly UpcomingPlan[] = [
  {
    id: 'barra-fixa-21',
    name: 'Domínio da Barra Fixa',
    description: 'Progressões para sua primeira barra até séries de 10 repetições.',
    durationDays: 21,
    levelLabel: 'Iniciante',
    coverEmoji: '🏋️',
  },
  {
    id: 'mobilidade-14',
    name: 'Mobilidade Diária',
    description: 'Rotina curta para quadril, coluna torácica e ombros.',
    durationDays: 14,
    levelLabel: 'Todos os níveis',
    coverEmoji: '🧘',
  },
  {
    id: 'hiit-21',
    name: 'HIIT Queima 21',
    description: 'Condicionamento metabólico com peso corporal em 21 dias.',
    durationDays: 21,
    levelLabel: 'Intermediário',
    coverEmoji: '🔥',
  },
];

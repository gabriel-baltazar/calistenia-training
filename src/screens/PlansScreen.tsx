import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlan, plans, upcomingPlans } from '../plans/registry';
import type { TrainingPlan } from '../plans/types';
import { useProgress } from '../progress/ProgressProvider';
import { PageHeader } from '../components/layout/PageHeader';
import { PlanCard, type PlanCardStatus } from '../components/plan/PlanCard';
import { StartPlanSheet } from '../components/plan/StartPlanSheet';
import { Chip } from '../components/ui/Chip';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import c from './common.module.css';
import s from './PlansScreen.module.css';

type Filter = 'all' | 'available' | 'upcoming';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'upcoming', label: 'Em breve' },
];

/** Ação pendente de confirmação ao trocar de plano. */
type PendingSwitch = { plan: TrainingPlan; action: 'start' | 'resume' };

export function PlansScreen() {
  const { doc, selectPlan } = useProgress();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [starting, setStarting] = useState<TrainingPlan | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null);

  // Só há "troca" quando o plano ativo atual existe no registry e é outro.
  const activePlan = getPlan(doc.activePlanId);

  function statusOf(plan: TrainingPlan): PlanCardStatus {
    if (activePlan?.id === plan.id && doc.plans[plan.id]) return 'active';
    return doc.plans[plan.id] ? 'saved' : 'new';
  }

  function resume(plan: TrainingPlan) {
    const saved = doc.plans[plan.id];
    if (!saved) return;
    // Retomar: seleciona sem resetar e mantém a startDate salva.
    selectPlan(plan.id, saved.startDate);
    navigate('/');
  }

  function request(plan: TrainingPlan, action: 'start' | 'resume') {
    if (activePlan && activePlan.id !== plan.id) {
      setPendingSwitch({ plan, action });
      return;
    }
    if (action === 'start') setStarting(plan);
    else resume(plan);
  }

  const showAvailable = filter !== 'upcoming';
  const showUpcoming = filter !== 'available';

  return (
    <div className={c.stack}>
      <PageHeader title="Planos" subtitle="Escolha o plano que você quer seguir." />

      <div className={s.filters} role="group" aria-label="Filtrar planos">
        {FILTERS.map((f) => (
          <Chip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <div className={s.grid}>
        {showAvailable &&
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              kind="plan"
              plan={plan}
              status={statusOf(plan)}
              onStart={() => request(plan, 'start')}
              onResume={() => request(plan, 'resume')}
              onContinue={() => navigate('/')}
            />
          ))}
        {showUpcoming && upcomingPlans.map((plan) => <PlanCard key={plan.id} kind="upcoming" plan={plan} />)}
      </div>

      <StartPlanSheet
        open={starting !== null}
        onClose={() => setStarting(null)}
        mode="start"
        planName={starting?.name ?? ''}
        onSubmit={(date) => {
          if (!starting) return;
          selectPlan(starting.id, date);
          setStarting(null);
          navigate('/');
        }}
      />

      <ConfirmDialog
        open={pendingSwitch !== null}
        title="Trocar de plano?"
        message="Seu progresso no plano atual fica salvo e pode ser retomado depois."
        confirmLabel="Trocar"
        onCancel={() => setPendingSwitch(null)}
        onConfirm={() => {
          const pending = pendingSwitch;
          setPendingSwitch(null);
          if (!pending) return;
          if (pending.action === 'start') setStarting(pending.plan);
          else resume(pending.plan);
        }}
      />
    </div>
  );
}

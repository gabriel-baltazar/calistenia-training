import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { cx } from '../lib/cx';
import { getPlan } from '../plans/registry';
import { useProgress } from '../progress/ProgressProvider';
import { activePlanProgress, planStats, todayDay } from '../progress/selectors';
import { PageHeader } from '../components/layout/PageHeader';
import { PhaseSection } from '../components/plan/PhaseSection';
import { ResetPlanDialog } from '../components/plan/ResetPlanDialog';
import { StartPlanSheet } from '../components/plan/StartPlanSheet';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IconButton } from '../components/ui/IconButton';
import c from './common.module.css';
import s from './PlanScreen.module.css';

// "Como funciona" abre por padrão só na primeira visita da sessão (flag em memória).
let rulesSeen = false;

export function PlanScreen() {
  const { doc, setStartDate } = useProgress();
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(() => !rulesSeen);
  const [editingDate, setEditingDate] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    rulesSeen = true;
  }, []);

  const plan = getPlan(doc.activePlanId);
  const progress = plan ? activePlanProgress(doc) : null;
  if (!plan || !progress) return <Navigate to="/planos" replace />;

  const stats = planStats(progress, plan);
  const today = todayDay(progress, plan);
  const lastPhase = plan.phases.length - 1;

  return (
    <div className={c.stack}>
      <PageHeader
        title={plan.name}
        subtitle={`${stats.daysDone} de ${plan.durationDays} dias concluídos`}
        actions={
          <IconButton icon={<CalendarDays size={20} />} label="Alterar data de início" onClick={() => setEditingDate(true)} />
        }
      />
      <div className={s.switchRow}>
        <Link to="/planos" className={c.linkButton}>
          Trocar plano
        </Link>
      </div>

      <section className={c.section}>
        <button
          type="button"
          className={c.collapseButton}
          aria-expanded={rulesOpen}
          aria-controls="como-funciona"
          onClick={() => setRulesOpen((v) => !v)}
        >
          Como funciona a progressão
          <ChevronRight size={20} aria-hidden="true" className={cx(c.chevron, rulesOpen && c.chevronOpen)} />
        </button>
        {rulesOpen && (
          <div id="como-funciona" className={s.rules}>
            {plan.phases.map((phase, i) => (
              <Card key={phase.id} padding="md" className={s.rule}>
                <h3 className={cx(s.ruleTitle, i === lastPhase && s.ruleTitleDanger)}>{phase.rulesTitle}</h3>
                <p className={c.muted}>{phase.description}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className={c.section}>
        <h2 className={c.sectionTitle}>Calendário</h2>
        <div className={s.legend} aria-hidden="true">
          <span className={s.legendItem}>
            <span className={s.legendToday} />
            Hoje
          </span>
          <span className={s.legendItem}>
            <span className={s.legendDone}>
              <Check size={10} strokeWidth={3} />
            </span>
            Concluído
          </span>
        </div>
        <div className={s.phases}>
          {plan.phases.map((phase) => (
            <PhaseSection
              key={phase.id}
              phase={phase}
              days={plan.days.filter((d) => d.phaseId === phase.id)}
              progress={progress}
              today={today}
              onSelect={(d) => navigate(`/treino/${d}`)}
            />
          ))}
        </div>
      </section>

      <div className={s.footer}>
        <Button variant="ghost" className={c.dangerGhost} leftIcon={<RotateCcw size={18} />} onClick={() => setConfirmReset(true)}>
          Reiniciar plano
        </Button>
      </div>

      <StartPlanSheet
        open={editingDate}
        onClose={() => setEditingDate(false)}
        mode="edit"
        planName={plan.name}
        initialDate={progress.startDate}
        onSubmit={(date) => {
          setStartDate(date);
          setEditingDate(false);
        }}
      />
      <ResetPlanDialog open={confirmReset} onClose={() => setConfirmReset(false)} />
    </div>
  );
}

import type { TrainingPlan, UpcomingPlan } from '../../plans/types';
import { cx } from '../../lib/cx';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import s from './PlanCard.module.css';

/** active = plano atual; saved = tem progresso salvo mas não está ativo; new = nunca iniciado. */
export type PlanCardStatus = 'active' | 'saved' | 'new';

export type PlanCardProps =
  | {
      kind: 'plan';
      plan: TrainingPlan;
      status: PlanCardStatus;
      onStart: () => void;
      onResume: () => void;
      onContinue: () => void;
    }
  | { kind: 'upcoming'; plan: UpcomingPlan };

export function PlanCard(props: PlanCardProps) {
  if (props.kind === 'upcoming') {
    const { plan } = props;
    return (
      <Card as="article" padding="lg" className={cx(s.card, s.upcoming)} aria-disabled="true">
        <div className={s.top}>
          <span className={s.emoji} aria-hidden="true">
            {plan.coverEmoji}
          </span>
          <Badge>Em breve</Badge>
        </div>
        <h2 className={s.name}>{plan.name}</h2>
        <p className={s.description}>{plan.description}</p>
        <div className={s.chips}>
          <Chip size="sm">{plan.durationDays} dias</Chip>
          <Chip size="sm">{plan.levelLabel}</Chip>
        </div>
      </Card>
    );
  }

  const { plan, status, onStart, onResume, onContinue } = props;
  return (
    <Card as="article" padding="lg" className={cx(s.card, status === 'active' && s.active)}>
      <div className={s.top}>
        <span className={s.emoji} aria-hidden="true">
          {plan.coverEmoji}
        </span>
        {status === 'active' && <Badge tone="primary">Plano atual</Badge>}
      </div>
      <h2 className={s.name}>{plan.name}</h2>
      <p className={s.tagline}>{plan.tagline}</p>
      <p className={s.description}>{plan.description}</p>
      <div className={s.chips}>
        <Chip size="sm">{plan.durationDays} dias</Chip>
        <Chip size="sm">{plan.levelLabel}</Chip>
        <Chip size="sm">{plan.equipmentLabel}</Chip>
      </div>
      <div className={s.actions}>
        {status === 'active' && (
          <Button size="lg" fullWidth onClick={onContinue}>
            Continuar
          </Button>
        )}
        {status === 'saved' && (
          <Button size="lg" fullWidth onClick={onResume}>
            Retomar plano
          </Button>
        )}
        {status === 'new' && (
          <Button size="lg" fullWidth onClick={onStart}>
            Começar plano
          </Button>
        )}
      </div>
    </Card>
  );
}

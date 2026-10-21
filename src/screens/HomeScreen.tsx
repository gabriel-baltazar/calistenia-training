import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { Dumbbell, Flame, Trophy } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { listStagger } from '../design/motion';
import { useMotionInitial } from '../design/motionStatus';
import { pluralDays } from '../lib/format';
import { getPlan } from '../plans/registry';
import type { PlanDay, PlanPhase, TrainingPlan } from '../plans/types';
import { useProgress } from '../progress/ProgressProvider';
import {
  activePlanProgress,
  daysUntilStart,
  isDayDone,
  nextIncompleteDay,
  planStats,
  streaks,
  todayDay,
} from '../progress/selectors';
import type { PlanProgress } from '../storage/types';
import { WeekStrip } from '../components/plan/WeekStrip';
import { HeroBackground } from '../components/three/HeroBackground';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, GlassCard } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { ProgressRing } from '../components/ui/ProgressRing';
import { StatTile } from '../components/ui/StatTile';
import c from './common.module.css';
import s from './HomeScreen.module.css';

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const phaseOfDay = (plan: TrainingPlan, day: number): PlanPhase | undefined =>
  plan.phases.find((p) => day >= p.dayRange[0] && day <= p.dayRange[1]);

interface TodayHeroProps {
  plan: TrainingPlan;
  progress: PlanProgress;
  today: number;
  planDay: PlanDay;
  phase: PlanPhase | undefined;
}

/** Cartão-herói da Início com as variantes do §10.2. */
function TodayHero({ plan, progress, today, planDay, phase }: TodayHeroProps) {
  const navigate = useNavigate();
  const stats = planStats(progress, plan);
  const until = daysUntilStart(progress);

  let content: ReactNode;
  if (stats.daysDone >= plan.durationDays) {
    content = (
      <>
        <p className={c.overline}>{plan.name}</p>
        <h2 className={s.heroTitle}>Protocolo concluído! 🏆</h2>
        <Button size="lg" onClick={() => navigate('/perfil')}>
          Ver progresso
        </Button>
      </>
    );
  } else if (until > 0) {
    content = (
      <>
        <p className={c.overline}>{plan.name}</p>
        <h2 className={s.heroTitle}>Seu plano começa em {pluralDays(until)}.</h2>
        <Button size="lg" onClick={() => navigate('/treino/1')}>
          Treinar o Dia 1 agora
        </Button>
      </>
    );
  } else if (isDayDone(progress, today)) {
    const next = nextIncompleteDay(progress, plan);
    content = (
      <>
        <p className={c.overline}>Treino de hoje concluído ✓</p>
        <h2 className={s.heroTitle}>{planDay.title}</h2>
        <p className={s.heroText}>Mandou bem! Descanse ou adiante o próximo.</p>
        {next !== null && (
          <Button size="lg" onClick={() => navigate(`/treino/${next}`)}>
            Ver próximo treino
          </Button>
        )}
      </>
    );
  } else {
    content = (
      <>
        <p className={c.overline}>Treino de hoje</p>
        <p className={s.heroDay}>
          Dia {today} de {plan.durationDays}
          {phase ? ` • ${phase.shortName}` : ''}
        </p>
        <h2 className={s.heroTitle}>{planDay.title}</h2>
        <p className={s.heroText}>
          {planDay.weekdayLabel} • {planDay.exercises.length} exercícios
        </p>
        <Button size="lg" onClick={() => navigate(`/treino/${today}`)}>
          Começar treino
        </Button>
      </>
    );
  }

  return (
    <GlassCard padding="lg" className={s.heroCard}>
      <div className={s.heroArt}>
        <HeroBackground variant="home" />
      </div>
      <div className={s.heroContent}>{content}</div>
    </GlassCard>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const { doc } = useProgress();
  const navigate = useNavigate();
  const listInitial = useMotionInitial('initial');

  const plan = getPlan(doc.activePlanId);
  const progress = plan ? activePlanProgress(doc) : null;
  const now = new Date();
  const displayName = user?.displayName ?? 'Atleta';
  const dateLabel = capitalize(new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now));

  const header = (
    <header className={s.header}>
      <Avatar name={displayName} photoURL={user?.photoURL} size={48} />
      <div className={s.headerText}>
        <h1 className={s.hello}>Olá, {displayName}</h1>
        <p className={c.muted}>{dateLabel}</p>
      </div>
    </header>
  );

  if (!plan || !progress) {
    return (
      <div className={c.stack}>
        {header}
        <GlassCard padding="lg" className={s.emptyHero}>
          <h2 className={s.heroTitle}>Escolha seu plano</h2>
          <p className={s.heroText}>Comece o Protocolo 28 Dias de Calistenia ou explore outros planos.</p>
          <Link to="/planos" className={s.primaryLink}>
            Ver planos
          </Link>
        </GlassCard>
      </div>
    );
  }

  const today = todayDay(progress, plan, now);
  const planDay = plan.days[today - 1];
  const phase = phaseOfDay(plan, today);
  const stats = planStats(progress, plan);
  const streak = streaks(progress, plan, now);
  const weekDays = phase ? plan.days.filter((d) => d.phaseId === phase.id) : [];

  return (
    <div className={c.stack}>
      {header}

      {planDay && <TodayHero plan={plan} progress={progress} today={today} planDay={planDay} phase={phase} />}

      <section className={s.progressRow} aria-label="Seu progresso">
        <ProgressRing
          value={stats.pct / 100}
          size={148}
          stroke={12}
          label={`${stats.pct}%`}
          sublabel={`${stats.daysDone}/${plan.durationDays} dias`}
          ariaLabel={`Progresso: ${stats.pct}%, ${stats.daysDone} de ${plan.durationDays} dias`}
        />
        <m.ul className={s.statList} variants={listStagger.container} initial={listInitial} animate="enter">
          <m.li variants={listStagger.item}>
            <StatTile icon={<Flame size={20} />} label="Sequência" value={streak.current} unit={streak.current === 1 ? 'dia' : 'dias'} />
          </m.li>
          <m.li variants={listStagger.item}>
            <StatTile icon={<Dumbbell size={20} />} label="Séries feitas" value={stats.setsDone} />
          </m.li>
          <m.li variants={listStagger.item}>
            <StatTile icon={<Trophy size={20} />} label="Melhor sequência" value={streak.best} unit={streak.best === 1 ? 'dia' : 'dias'} />
          </m.li>
        </m.ul>
      </section>

      {weekDays.length > 0 && (
        <section className={c.section}>
          <h2 className={c.sectionTitle}>Esta semana</h2>
          <WeekStrip days={weekDays} progress={progress} today={today} onSelect={(d) => navigate(`/treino/${d}`)} />
        </section>
      )}

      {phase && (
        <Card padding="lg" className={s.phaseCard}>
          <p className={c.overline}>Fase atual</p>
          <h2 className={c.sectionTitle}>{phase.name}</h2>
          <p className={c.muted}>{phase.description}</p>
          <div className={s.chips}>
            <Chip size="sm">{phase.format}</Chip>
            <Chip size="sm">{phase.setsLabel}</Chip>
            <Chip size="sm">{phase.restLabel}</Chip>
            <Chip size="sm">{phase.tempo}</Chip>
          </div>
        </Card>
      )}
    </div>
  );
}

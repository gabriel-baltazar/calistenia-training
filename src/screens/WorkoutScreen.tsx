import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { ChevronLeft, ChevronRight, Gauge, Image as ImageIcon, ImageOff, LayoutList, Pause, Play, Repeat, Timer, Trash2 } from 'lucide-react';
import { cx } from '../lib/cx';
import { pluralSeconds } from '../lib/format';
import { listStagger } from '../design/motion';
import { useMotionInitial } from '../design/motionStatus';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { getPlan } from '../plans/registry';
import type { Equipment, Exercise } from '../plans/types';
import { useProgress } from '../progress/ProgressProvider';
import { activePlanProgress, daySetStats, isDayDone, isSetDone, todayDay } from '../progress/selectors';
import { beepDayDone, unlockAudio } from '../timer/audio';
import { useTimerActions } from '../timer/TimerProvider';
import { ExerciseCard } from '../components/exercise/ExerciseCard';
import { ExerciseDetailSheet } from '../components/exercise/ExerciseDetailSheet';
import { useTimerSheet } from '../components/timer/timerSheet';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { IconButton } from '../components/ui/IconButton';
import { ProgressRing } from '../components/ui/ProgressRing';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatTile } from '../components/ui/StatTile';
import { useToast } from '../components/ui/Toast';
import c from './common.module.css';
import s from './WorkoutScreen.module.css';

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'bar', label: 'Com barra' },
  { value: 'none', label: 'Sem equipamento' },
];

const CELEBRATION_MS = 1200;
const PARTICLES = 12;

/** `/treino` (link direto) → dia de hoje. */
export function WorkoutRedirect() {
  const { doc } = useProgress();
  const plan = getPlan(doc.activePlanId);
  const progress = plan ? activePlanProgress(doc) : null;
  if (!plan || !progress) return <Navigate to="/planos" replace />;
  return <Navigate to={`/treino/${todayDay(progress, plan)}`} replace />;
}

export function WorkoutScreen() {
  // O dia vem SEMPRE de useParams() (a página que sai mantém os params antigos durante o exit, §5).
  const { day: dayParam } = useParams();
  const navigate = useNavigate();
  const { doc, toggleSet, toggleDay, resetDaySets, updateSettings } = useProgress();
  const { startStopwatch } = useTimerActions();
  const timerSheet = useTimerSheet();
  const { toast } = useToast();
  const reducedMotion = usePrefersReducedMotion();
  const listInitial = useMotionInitial('initial');

  const [detail, setDetail] = useState<Exercise | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [celebration, setCelebration] = useState(0);

  useEffect(() => {
    if (celebration === 0) return;
    const handle = window.setTimeout(() => setCelebration(0), CELEBRATION_MS);
    return () => window.clearTimeout(handle);
  }, [celebration]);

  const closeDetail = useCallback(() => setDetail(null), []);

  const plan = getPlan(doc.activePlanId);
  const progress = plan ? activePlanProgress(doc) : null;
  if (!plan || !progress) return <Navigate to="/planos" replace />;

  const n = dayParam !== undefined && /^\d+$/.test(dayParam) ? Number(dayParam) : Number.NaN;
  const planDay = Number.isInteger(n) && n >= 1 && n <= plan.durationDays ? plan.days[n - 1] : undefined;
  if (!planDay) return <Navigate to={`/treino/${todayDay(progress, plan)}`} replace />;

  const day = planDay.day;
  const phase = plan.phases.find((p) => p.id === planDay.phaseId);
  const { equipment, showPhotos, animateMedia } = doc.settings;
  const stats = daySetStats(progress, planDay);
  const dayDone = isDayDone(progress, day);
  const allSetsDone = stats.total > 0 && stats.done === stats.total;
  const restValue =
    planDay.kind === 'hiit' ? pluralSeconds(planDay.exercises[0]?.restSeconds ?? 20) : (phase?.restLabel ?? '');

  function concludeDay() {
    unlockAudio();
    const done = toggleDay(day);
    if (!done) return;
    beepDayDone();
    try {
      navigator.vibrate?.(60);
    } catch {
      // vibração indisponível
    }
    setCelebration((k) => k + 1);
    toast({ message: `Dia ${day} concluído! 🔥`, tone: 'success' });
  }

  return (
    <div className={c.stack}>
      <header className={s.top}>
        <div className={s.nav}>
          <IconButton
            icon={<ChevronLeft size={20} />}
            label="Dia anterior"
            disabled={day <= 1}
            onClick={() => navigate(`/treino/${day - 1}`)}
          />
          <div className={s.badges}>
            <Badge tone="primary">
              Dia {day} de {plan.durationDays}
            </Badge>
            {phase && <Badge>{phase.name.toUpperCase()}</Badge>}
          </div>
          <IconButton
            icon={<ChevronRight size={20} />}
            label="Próximo dia"
            disabled={day >= plan.durationDays}
            onClick={() => navigate(`/treino/${day + 1}`)}
          />
        </div>
        <div className={s.titleRow}>
          <div className={s.titleText}>
            <p className={c.overline}>{planDay.weekdayLabel}</p>
            <h1 className={s.title}>{planDay.title}</h1>
            <p className={c.muted}>{planDay.subtitle}</p>
          </div>
          <div className={cx(s.ringWrap, celebration > 0 && !reducedMotion && s.celebrate)}>
            <ProgressRing
              value={stats.total > 0 ? stats.done / stats.total : 0}
              size={72}
              stroke={7}
              tone={allSetsDone || dayDone ? 'success' : 'primary'}
              label={
                <span className={s.ringLabel}>
                  {stats.done}/{stats.total}
                </span>
              }
              ariaLabel={`Séries do dia: ${stats.done} de ${stats.total}`}
            />
          </div>
        </div>
      </header>

      {phase && (
        <section className={c.section} aria-label="Regras da semana">
          <h2 className={c.sectionTitle}>Regras da semana</h2>
          <ul className={cx(c.tiles, s.rules)}>
            <li>
              <StatTile icon={<LayoutList size={18} />} label="Formato da Semana" value={phase.format} />
            </li>
            <li>
              <StatTile icon={<Repeat size={18} />} label="Volume por Exercício" value={phase.setsLabel} />
            </li>
            <li>
              <StatTile icon={<Timer size={18} />} label="Descanso Automático" value={restValue} />
            </li>
            <li>
              <StatTile icon={<Gauge size={18} />} label="Cadência / Ritmo" value={phase.tempo} />
            </li>
          </ul>
        </section>
      )}

      <div className={s.controls}>
        <SegmentedControl
          options={EQUIPMENT_OPTIONS}
          value={equipment}
          onChange={(value) => updateSettings({ equipment: value })}
          ariaLabel="Equipamento"
        />
        <div className={s.toggles}>
          <IconButton
            icon={showPhotos ? <ImageOff size={20} /> : <ImageIcon size={20} />}
            label={showPhotos ? 'Mostrar só ilustração' : 'Mostrar fotos reais'}
            onClick={() => updateSettings({ showPhotos: !showPhotos })}
          />
          <IconButton
            icon={animateMedia ? <Pause size={20} /> : <Play size={20} />}
            label={animateMedia ? 'Pausar animações' : 'Animar fotos'}
            onClick={() => updateSettings({ animateMedia: !animateMedia })}
            disabled={!showPhotos}
          />
        </div>
      </div>

      {planDay.kind === 'challenge' && (
        <GlassCard padding="lg" className={s.challenge}>
          <h2 className={c.sectionTitle}>Desafio por tempo</h2>
          <p className={c.muted}>Ative o cronômetro livre e quebre seu recorde pessoal!</p>
          <Button
            leftIcon={<Timer size={18} />}
            onClick={() => {
              startStopwatch();
              timerSheet.open();
            }}
          >
            Iniciar cronômetro
          </Button>
        </GlassCard>
      )}

      <section className={c.section}>
        <div className={c.sectionHeader}>
          <h2 className={c.sectionTitle}>Sequência de exercícios</h2>
          <Button size="sm" variant="ghost" leftIcon={<Trash2 size={16} />} onClick={() => setConfirmClear(true)}>
            Limpar séries do dia
          </Button>
        </div>
        <m.ul className={s.list} variants={listStagger.container} initial={listInitial} animate="enter">
          {planDay.exercises.map((exercise, i) => (
            <m.li key={exercise.id} variants={listStagger.item}>
              <ExerciseCard
                exercise={exercise}
                index={i}
                equipment={equipment}
                showPhotos={showPhotos}
                animateMedia={animateMedia}
                baseUrl={plan.mediaBaseUrl}
                doneSets={Array.from({ length: exercise.sets }, (_, k) => isSetDone(progress, day, exercise.id, k + 1))}
                onToggleSet={(set) => toggleSet(day, exercise.id, set)}
                onOpenDetail={() => setDetail(exercise)}
              />
            </m.li>
          ))}
        </m.ul>
      </section>

      <div className={s.conclude}>
        {allSetsDone && !dayDone && <p className={s.hint}>Todas as séries feitas. Conclua o dia!</p>}
        <div className={s.concludeButton}>
          <Button size="lg" fullWidth className={cx(dayDone && s.doneButton)} variant={dayDone ? 'secondary' : 'primary'} onClick={concludeDay}>
            {dayDone ? `✓ Dia ${day} concluído` : `⚔️ Concluir Dia ${day}`}
          </Button>
          {celebration > 0 && !reducedMotion && (
            <span key={celebration} className={s.particles} aria-hidden="true">
              {Array.from({ length: PARTICLES }, (_, i) => (
                <span key={i} className={s.particle} style={{ '--i': i } as CSSProperties} />
              ))}
            </span>
          )}
        </div>
      </div>

      <ExerciseDetailSheet exercise={detail} equipment={equipment} baseUrl={plan.mediaBaseUrl} onClose={closeDetail} />
      <ConfirmDialog
        open={confirmClear}
        title="Limpar séries do dia"
        message={`Limpar todas as séries marcadas do Dia ${day}?`}
        confirmLabel="Limpar"
        tone="danger"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          resetDaySets(day);
          setConfirmClear(false);
        }}
      />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cx } from '../../lib/cx';
import { mmss } from '../../lib/format';
import { useMotionInitial } from '../../design/motionStatus';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useTimerActions, useTimerState, type TimerState } from '../../timer/TimerProvider';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Modal } from '../ui/Modal';
import { ProgressRing } from '../ui/ProgressRing';
import { useTimerSheet, useTimerSheetOpen } from './timerSheet';
import s from './RestTimer.module.css';

const PRESETS = [20, 30, 45, 60, 90] as const;
const PULSE_MS = 1500;

function displaySeconds(t: TimerState): number {
  return t.mode === 'countdown' ? t.remainingSeconds : t.elapsedSeconds;
}

function ringValue(t: TimerState, reducedMotion: boolean): number {
  if (t.mode === 'countdown') return t.durationMs > 0 ? (t.remainingSeconds * 1000) / t.durationMs : 0;
  // Cronômetro: volta completa a cada minuto (estático com reduced motion).
  return reducedMotion ? 1 : (t.elapsedSeconds % 60) / 60;
}

/**
 * Cronômetro global (§11): pill de vidro acima do nav (sempre em /treino/*; nas outras telas só rodando ou
 * pausado) + sheet "Cronômetro". Único consumidor de useTimerState().
 */
export function RestTimer() {
  const timer = useTimerState();
  const { startCountdown, startStopwatch, pause, resume, reset } = useTimerActions();
  const sheet = useTimerSheet();
  const sheetOpen = useTimerSheetOpen();
  const { pathname } = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  const pillInitial = useMotionInitial({ opacity: 0, y: 16 });

  const [pulse, setPulse] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const prevStatus = useRef(timer.status);

  // Fim do countdown: pulso verde de 1,5 s + anúncio "Descanso concluído".
  useEffect(() => {
    const before = prevStatus.current;
    prevStatus.current = timer.status;
    if (timer.mode !== 'countdown' || before !== 'running' || timer.status !== 'finished') return;
    setPulse(true);
    setAnnouncement('Descanso concluído');
    const handle = window.setTimeout(() => {
      setPulse(false);
      setAnnouncement('');
    }, PULSE_MS);
    return () => window.clearTimeout(handle);
  }, [timer.status, timer.mode]);

  const running = timer.status === 'running';
  const visible = pathname.startsWith('/treino') || running || timer.status === 'paused' || pulse;
  const time = mmss(displaySeconds(timer) * 1000);
  const modeLabel = timer.mode === 'countdown' ? 'Timer de descanso' : 'Cronômetro livre';
  const toggle = () => (running ? pause() : resume());
  const primaryLabel = running ? 'Pausar' : timer.status === 'paused' ? 'Continuar' : 'Iniciar';

  return (
    <>
      <AnimatePresence>
        {visible && (
          <m.div
            key="pill"
            className={cx('glass', s.pill, pulse && s.pulse)}
            initial={pillInitial}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button type="button" className={s.open} onClick={sheet.open} aria-label={`Abrir cronômetro: ${time}`} aria-haspopup="dialog">
              <ProgressRing value={ringValue(timer, reducedMotion)} size={32} stroke={4} ariaLabel={modeLabel} tone={pulse ? 'success' : 'primary'} />
              <span className={cx(s.time, 'num')} data-timer-display="">
                {time}
              </span>
            </button>
            <button type="button" className={s.play} onClick={toggle} aria-label={running ? 'Pausar cronômetro' : 'Iniciar cronômetro'}>
              {running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            </button>
          </m.div>
        )}
      </AnimatePresence>

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>

      <Modal open={sheetOpen} onClose={sheet.close} title="Cronômetro" variant="sheet">
        <div className={s.sheet}>
          <ProgressRing
            value={ringValue(timer, reducedMotion)}
            size={220}
            stroke={14}
            label={time}
            sublabel={modeLabel}
            tone={pulse ? 'success' : 'primary'}
            ariaLabel={`${modeLabel}: ${time}`}
            className={s.bigRing}
          />
          <div className={s.presets} role="group" aria-label="Predefinições">
            {PRESETS.map((seconds) => (
              <Chip
                key={seconds}
                selected={timer.mode === 'countdown' && timer.durationMs === seconds * 1000}
                onClick={() => startCountdown(seconds)}
              >
                {seconds}s
              </Chip>
            ))}
            <Chip selected={timer.mode === 'stopwatch'} onClick={startStopwatch}>
              ⏱️ Livre
            </Chip>
          </div>
          <div className={s.controls}>
            <Button
              size="lg"
              variant={running ? 'secondary' : 'primary'}
              leftIcon={running ? <Pause size={18} /> : <Play size={18} />}
              onClick={toggle}
            >
              {primaryLabel}
            </Button>
            <Button size="lg" variant="ghost" leftIcon={<RotateCcw size={18} />} onClick={reset}>
              Reiniciar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

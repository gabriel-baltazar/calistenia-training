import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useProgress } from '../progress/ProgressProvider';
import { beepEnd, beepStart, beepTick, setAudioMuted, unlockAudio } from './audio';

export type TimerMode = 'countdown' | 'stopwatch';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerActions {
  startCountdown(seconds: number): void;
  startStopwatch(): void;
  pause(): void;
  /** Retoma; em `idle`/`finished` reinicia do durationMs (countdown) ou do zero (stopwatch). */
  resume(): void;
  /** Countdown volta a durationMs; stopwatch volta a 0. */
  reset(): void;
}

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  durationMs: number;
  remainingSeconds: number;
  elapsedSeconds: number;
}

interface Engine {
  mode: TimerMode;
  status: TimerStatus;
  durationMs: number;
  /** performance.now() do último start/resume; null fora de `running`. */
  startedAt: number | null;
  accumulatedMs: number;
}

const TICK_MS = 250;
/** Estado inicial (paridade com o legado): countdown de 45 s parado → "00:45". */
const INITIAL_ENGINE: Engine = { mode: 'countdown', status: 'idle', durationMs: 45_000, startedAt: null, accumulatedMs: 0 };

const elapsedMs = (e: Engine, now: number): number =>
  e.accumulatedMs + (e.status === 'running' && e.startedAt !== null ? now - e.startedAt : 0);

const remainingMs = (e: Engine, now: number): number => Math.max(0, e.durationMs - elapsedMs(e, now));

function toView(e: Engine, now: number): TimerState {
  return {
    mode: e.mode,
    status: e.status,
    durationMs: e.durationMs,
    remainingSeconds: Math.ceil(remainingMs(e, now) / 1000),
    elapsedSeconds: Math.floor(elapsedMs(e, now) / 1000),
  };
}

function sameView(a: TimerState, b: TimerState): boolean {
  return (
    a.mode === b.mode &&
    a.status === b.status &&
    a.durationMs === b.durationMs &&
    a.remainingSeconds === b.remainingSeconds &&
    a.elapsedSeconds === b.elapsedSeconds
  );
}

const TimerActionsContext = createContext<TimerActions | null>(null);
const TimerStateContext = createContext<TimerState | null>(null);

/** Ações estáveis (não re-renderizam com o tick). Use em WorkoutScreen/ExerciseCard/SetToggle. */
export function useTimerActions(): TimerActions {
  const ctx = useContext(TimerActionsContext);
  if (!ctx) throw new Error('useTimerActions precisa estar dentro de <TimerProvider>.');
  return ctx;
}

/** Estado do visor (muda até 4×/s enquanto roda). Só o RestTimer deve usar. */
export function useTimerState(): TimerState {
  const ctx = useContext(TimerStateContext);
  if (!ctx) throw new Error('useTimerState precisa estar dentro de <TimerProvider>.');
  return ctx;
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { doc } = useProgress();
  const sound = doc.settings.sound;

  const engineRef = useRef<Engine>({ ...INITIAL_ENGINE });
  const intervalRef = useRef<number | null>(null);
  /** Último segundo inteiro restante visto pelo tick (bips de 3/2/1 na transição). */
  const lastWholeRef = useRef<number | null>(null);
  const [view, setView] = useState<TimerState>(() => toView(INITIAL_ENGINE, 0));

  useEffect(() => {
    setAudioMuted(!sound);
  }, [sound]);

  const actions = useMemo<TimerActions>(() => {
    const publish = () => {
      const next = toView(engineRef.current, performance.now());
      setView((prev) => (sameView(prev, next) ? prev : next));
    };

    const stopInterval = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const finish = () => {
      const e = engineRef.current;
      engineRef.current = { ...e, status: 'finished', startedAt: null, accumulatedMs: e.durationMs };
      stopInterval();
      beepEnd();
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        // vibração indisponível
      }
    };

    const tick = () => {
      const e = engineRef.current;
      if (e.status !== 'running') return stopInterval();
      if (e.mode === 'countdown') {
        const remaining = remainingMs(e, performance.now());
        if (remaining <= 0) {
          finish();
        } else {
          const whole = Math.ceil(remaining / 1000);
          const last = lastWholeRef.current;
          if (last !== null && whole < last && whole <= 3) beepTick();
          lastWholeRef.current = whole;
        }
      }
      publish();
    };

    const startInterval = () => {
      stopInterval();
      intervalRef.current = window.setInterval(tick, TICK_MS);
    };

    const run = (mode: TimerMode, durationMs: number) => {
      unlockAudio();
      engineRef.current = { mode, status: 'running', durationMs, startedAt: performance.now(), accumulatedMs: 0 };
      lastWholeRef.current = Math.ceil(durationMs / 1000);
      beepStart();
      startInterval();
      publish();
    };

    return {
      startCountdown(seconds) {
        const ms = Math.max(1, Math.round(seconds)) * 1000;
        run('countdown', ms);
      },
      startStopwatch() {
        run('stopwatch', engineRef.current.durationMs);
      },
      pause() {
        const e = engineRef.current;
        if (e.status !== 'running') return;
        engineRef.current = { ...e, status: 'paused', startedAt: null, accumulatedMs: elapsedMs(e, performance.now()) };
        stopInterval();
        publish();
      },
      resume() {
        const e = engineRef.current;
        if (e.status === 'running') return;
        if (e.status === 'idle' || e.status === 'finished') {
          run(e.mode, e.durationMs);
          return;
        }
        unlockAudio();
        engineRef.current = { ...e, status: 'running', startedAt: performance.now() };
        if (e.mode === 'countdown') lastWholeRef.current = Math.ceil(remainingMs(e, performance.now()) / 1000);
        startInterval();
        publish();
      },
      reset() {
        const e = engineRef.current;
        stopInterval();
        engineRef.current = { ...e, status: 'idle', startedAt: null, accumulatedMs: 0 };
        lastWholeRef.current = null;
        publish();
      },
    };
  }, []);

  // Logout/desmontagem descarta o timer.
  useEffect(
    () => () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
    [],
  );

  return (
    <TimerActionsContext.Provider value={actions}>
      <TimerStateContext.Provider value={view}>{children}</TimerStateContext.Provider>
    </TimerActionsContext.Provider>
  );
}

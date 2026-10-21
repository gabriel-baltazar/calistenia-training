import { createContext, useContext } from 'react';

export interface TimerSheetActions {
  open(): void;
  close(): void;
}

/** Ações estáveis (abrir/fechar o sheet do cronômetro) — não re-renderizam quem só abre. */
export const TimerSheetActionsContext = createContext<TimerSheetActions | null>(null);
/** Se o sheet está aberto (só o RestTimer lê). */
export const TimerSheetOpenContext = createContext(false);

export function useTimerSheet(): TimerSheetActions {
  const ctx = useContext(TimerSheetActionsContext);
  if (!ctx) throw new Error('useTimerSheet precisa estar dentro de <TimerSheetProvider>.');
  return ctx;
}

export function useTimerSheetOpen(): boolean {
  return useContext(TimerSheetOpenContext);
}

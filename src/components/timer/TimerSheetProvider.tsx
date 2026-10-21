import { useMemo, useState, type ReactNode } from 'react';
import { TimerSheetActionsContext, TimerSheetOpenContext, type TimerSheetActions } from './timerSheet';

export function TimerSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const actions = useMemo<TimerSheetActions>(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }),
    [],
  );
  return (
    <TimerSheetActionsContext.Provider value={actions}>
      <TimerSheetOpenContext.Provider value={open}>{children}</TimerSheetOpenContext.Provider>
    </TimerSheetActionsContext.Provider>
  );
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { pageVariants } from '../../design/motion';
import { useMotionInitial, useMotionStatus } from '../../design/motionStatus';
import { RestTimer } from '../timer/RestTimer';
import { TimerSheetProvider } from '../timer/TimerSheetProvider';
import { BottomNav } from './BottomNav';
import { FrozenOutlet } from './FrozenOutlet';
import s from './AppShell.module.css';

const scrollTop = () => window.scrollTo(0, 0);

/** Grade do app autenticado: nav inferior (mobile) / rail (desktop), página com transição e o RestTimer. */
export function AppShell() {
  const location = useLocation();
  const motionStatus = useMotionStatus();
  const pageInitial = useMotionInitial('initial');
  const motionFailed = motionStatus === 'failed';

  // Sem features do Framer não há animação de saída (o AnimatePresence esperaria para sempre):
  // troca direta de página, com o scroll voltando ao topo.
  useEffect(() => {
    if (motionFailed) scrollTop();
  }, [location.pathname, motionFailed]);

  return (
    <TimerSheetProvider>
      <div className={s.shell}>
        <div className={s.backdrop} aria-hidden="true" />
        <BottomNav />
        <main className={s.main}>
          {motionFailed ? (
            <div key={location.pathname} className={s.page}>
              <FrozenOutlet />
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false} onExitComplete={scrollTop}>
              <m.div
                key={location.pathname}
                className={s.page}
                variants={pageVariants}
                initial={pageInitial}
                animate="enter"
                exit="exit"
              >
                <FrozenOutlet />
              </m.div>
            </AnimatePresence>
          )}
        </main>
        <RestTimer />
      </div>
    </TimerSheetProvider>
  );
}

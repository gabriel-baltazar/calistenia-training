import { LazyMotion, MotionConfig } from 'framer-motion';
import { loadMotionFeatures } from './design/motionStatus';
import { ToastProvider } from './components/ui/Toast';
import { Splash } from './components/layout/Splash';

// Placeholder do FEAT-001: AuthProvider, HashRouter e rotas entram no FEAT-003 (plan.md item 11).
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <ToastProvider>
          <Splash />
        </ToastProvider>
      </LazyMotion>
    </MotionConfig>
  );
}

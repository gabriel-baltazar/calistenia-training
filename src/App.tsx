import { LazyMotion, MotionConfig } from 'framer-motion';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { loadMotionFeatures } from './design/motionStatus';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RequireActivePlan } from './components/layout/RequireActivePlan';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PlanScreen } from './screens/PlanScreen';
import { WorkoutRedirect, WorkoutScreen } from './screens/WorkoutScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { PlansScreen } from './screens/PlansScreen';
import { ProfileScreen } from './screens/ProfileScreen';

// Rotas declaradas uma única vez (§5). O AppShell (dentro do ProtectedRoute) faz as transições.
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <ToastProvider>
          <AuthProvider>
            <HashRouter>
              <Routes>
                <Route path="/login" element={<LoginScreen />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<HomeScreen />} />
                  <Route element={<RequireActivePlan />}>
                    <Route path="/plano" element={<PlanScreen />} />
                    <Route path="/treino" element={<WorkoutRedirect />} />
                    <Route path="/treino/:day" element={<WorkoutScreen />} />
                  </Route>
                  <Route path="/biblioteca" element={<LibraryScreen />} />
                  <Route path="/planos" element={<PlansScreen />} />
                  <Route path="/perfil" element={<ProfileScreen />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HashRouter>
          </AuthProvider>
        </ToastProvider>
      </LazyMotion>
    </MotionConfig>
  );
}

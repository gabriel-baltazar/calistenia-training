import { Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Splash } from '../components/layout/Splash';
import { ProgressProvider } from '../progress/ProgressProvider';
import { TimerProvider } from '../timer/TimerProvider';
import { useAuth } from './AuthProvider';

/**
 * Layout das rotas protegidas: dono da regra "sem sessão, sem tela protegida" (§6.6).
 * `key={uid}` desmonta todo o estado ao trocar de usuário.
 */
export function ProtectedRoute() {
  const { status, user, signedOutByUser } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Splash />;
  if (status === 'unauthenticated' || !user) {
    // Depois de "Sair", o próximo login vai para "/" e não para a tela onde o usuário estava (R4-5).
    if (signedOutByUser) return <Navigate to="/login" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <ProgressProvider key={user.uid} uid={user.uid}>
      <TimerProvider>
        <AppShell />
      </TimerProvider>
    </ProgressProvider>
  );
}

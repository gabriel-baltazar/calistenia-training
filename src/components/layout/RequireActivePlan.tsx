import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useProgress } from '../../progress/ProgressProvider';
import { activePlanProgress } from '../../progress/selectors';
import { getPlan } from '../../plans/registry';

/**
 * Layout de /plano e /treino*. Loading/erro do progresso já são tratados pelo ProgressProvider (R4-1):
 * aqui só as checagens de plano (§5 passos 3–5).
 */
export function RequireActivePlan() {
  const { doc, notifyMissingPlanOnce } = useProgress();
  const plan = getPlan(doc.activePlanId);
  const progress = plan ? activePlanProgress(doc) : null;
  // Plano salvo que não existe mais no registry: o id e o progresso continuam no doc.
  const missingPlan = doc.activePlanId !== null && plan === null;

  useEffect(() => {
    if (missingPlan) notifyMissingPlanOnce();
  }, [missingPlan, notifyMissingPlanOnce]);

  if (!plan || !progress) return <Navigate to="/planos" replace />;
  return <Outlet />;
}

import type { TrainingPlan } from './types';
import { validatePlans } from './validatePlans';

// Descoberta automática: cada pasta src/plans/<id>/index.ts com `export default` de um TrainingPlan.
const modules = import.meta.glob<{ default: TrainingPlan }>('./*/index.ts', { eager: true });

export const plans: readonly TrainingPlan[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.id.localeCompare(b.id));

export const getPlan = (id: string | null | undefined): TrainingPlan | null =>
  plans.find((p) => p.id === id) ?? null;

export { upcomingPlans } from './upcoming';

if (import.meta.env.DEV) validatePlans(plans);

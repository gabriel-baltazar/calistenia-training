import { useSyncExternalStore } from 'react';
import type { FeatureBundle } from 'framer-motion';

/**
 * Status das features do Framer (domMax) carregadas sob demanda (§14, revisão R4-2).
 * Store de módulo (sem provider), para que `loadMotionFeatures` (função comum) possa atualizá-lo.
 */
export type MotionStatus = 'pending' | 'loaded' | 'failed';

let status: MotionStatus = 'pending';
const listeners = new Set<() => void>();

export function getMotionStatus(): MotionStatus {
  return status;
}

export function setMotionStatus(next: MotionStatus): void {
  if (next === status) return;
  status = next;
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMotionStatus(): MotionStatus {
  return useSyncExternalStore(subscribe, getMotionStatus, getMotionStatus);
}

/**
 * `initial` seguro: só devolve `v` quando as features já chegaram. Enquanto `pending`/`failed`,
 * devolve `false`, e o Framer nasce direto no estado de `animate` (conteúdo visível, sem animação).
 */
export function useMotionInitial<T>(v: T): T | false {
  return useMotionStatus() === 'loaded' ? v : false;
}

const RETRY_MS = 2000;

function importFeatures(): Promise<FeatureBundle> {
  return import('./motionFeatures').then((m) => {
    setMotionStatus('loaded');
    return m.default;
  });
}

/** Passado para `<LazyMotion features={loadMotionFeatures} strict>`. */
export async function loadMotionFeatures(): Promise<FeatureBundle> {
  try {
    return await importFeatures();
  } catch {
    console.warn('[motion] features indisponíveis');
  }
  await new Promise<void>((resolve) => window.setTimeout(resolve, RETRY_MS));
  try {
    return await importFeatures();
  } catch {
    setMotionStatus('failed');
    // Nunca resolve de propósito: rejeitar faria o LazyMotion expor uma rejeição não tratada,
    // e um FeatureBundle falso não passa no tsc (exige `renderer`). Sem features, os m.*
    // continuam visíveis porque useMotionInitial devolve `initial={false}` com status 'failed'.
    return new Promise<never>(() => {});
  }
}

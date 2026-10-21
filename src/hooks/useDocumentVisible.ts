import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

const getSnapshot = (): boolean => document.visibilityState !== 'hidden';

/** false enquanto a aba está oculta (visibilitychange). */
export function useDocumentVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

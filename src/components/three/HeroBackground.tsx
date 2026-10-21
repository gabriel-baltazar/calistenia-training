import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/cx';
import { useCanRender3D } from '../../hooks/useCanRender3D';
import { useDocumentVisible } from '../../hooks/useDocumentVisible';
import { useInView } from '../../hooks/useInView';
import { ErrorBoundary } from '../layout/ErrorBoundary';
import s from './HeroBackground.module.css';

// O chunk `three` (three + R3F) só é pedido aqui, por import() dinâmico (§13).
const Scene3D = lazy(() => import('./Scene3D'));

export type HeroVariant = 'login' | 'home';

export interface HeroBackgroundProps {
  variant: HeroVariant;
  className?: string;
}

/** Adia a montagem do Canvas para depois do primeiro paint (requestIdleCallback com timeout 1500 ms). */
function scheduleIdle(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(cb, { timeout: 1500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(cb, 300);
  return () => window.clearTimeout(handle);
}

/**
 * Fundo do herói: o pôster CSS fica sempre por baixo; o Canvas 3D entra por cima (fade-in 0,6 s) só quando
 * useCanRender3D() permite. Qualquer falha (chunk, WebGL, contexto perdido) volta ao pôster sem quebrar a tela.
 */
export function HeroBackground({ variant, className }: HeroBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canRender3D = useCanRender3D();
  const inView = useInView(rootRef);
  const documentVisible = useDocumentVisible();
  const [idleReady, setIdleReady] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (!canRender3D) return;
    return scheduleIdle(() => setIdleReady(true));
  }, [canRender3D]);

  const disable = useCallback((reason: string, error?: unknown) => {
    console.warn(`[3d] desabilitado: ${reason}`, ...(error === undefined ? [] : [error]));
    setDisabled(true);
  }, []);

  const onSceneError = useCallback((error: unknown) => disable('falha ao carregar a cena', error), [disable]);
  const onContextLost = useCallback(() => disable('contexto WebGL perdido'), [disable]);

  const active = inView && documentVisible;
  const mountScene = canRender3D && idleReady && !disabled;

  return (
    <div ref={rootRef} className={cx(s.root, s[variant], className)} aria-hidden="true">
      <div className={s.poster} data-hero-poster="">
        <span className={s.orb} />
        <svg className={s.ring} viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="78" fill="none" stroke="#F97316" strokeOpacity="0.55" strokeWidth="1.2" />
          <circle cx="100" cy="100" r="54" fill="none" stroke="#FB923C" strokeOpacity="0.3" strokeWidth="0.8" strokeDasharray="3 5" />
          <circle cx="100" cy="100" r="22" fill="#F97316" fillOpacity="0.18" />
        </svg>
      </div>
      {mountScene && (
        <div className={s.canvas}>
          <ErrorBoundary fallback={null} onError={onSceneError}>
            <Suspense fallback={null}>
              <Scene3D variant={variant} active={active} onContextLost={onContextLost} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

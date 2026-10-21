import { usePrefersReducedMotion } from './usePrefersReducedMotion';

let webglSupport: boolean | null = null;

/** Teste de WebGL memoizado (um único canvas descartável por sessão). */
export function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    webglSupport = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

function deviceAllows3D(): boolean {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav?.connection?.saveData) return false;
  if (nav?.deviceMemory && nav.deviceMemory <= 2) return false;
  return true;
}

/** §13: sem reduced motion, com WebGL, sem economia de dados e com mais de 2 GB de memória. */
export function useCanRender3D(): boolean {
  const reducedMotion = usePrefersReducedMotion();
  return !reducedMotion && hasWebGL() && deviceAllows3D();
}

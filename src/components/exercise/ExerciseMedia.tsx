import { useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/cx';
import { useDocumentVisible } from '../../hooks/useDocumentVisible';
import { useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import type { AnatomyType } from '../../plans/types';
import { AnatomyIllustration } from './AnatomyIllustration';
import { mediaUrl } from './media';
import s from './ExerciseMedia.module.css';

export interface ExerciseMediaProps {
  /** plan.mediaBaseUrl; ausente → só a ilustração. */
  baseUrl?: string;
  mediaId: string;
  alt: string;
  animate: boolean;
  showPhotos: boolean;
  anatomy: AnatomyType;
  onOpen: () => void;
  /** Posição na lista: os 2 primeiros carregam sem lazy (acima da dobra). */
  index: number;
  className?: string;
}

const FRAME_MS = 850;
const PHASE_LABELS = ['1/2 • Posição Inicial', '2/2 • Contração / Execução'] as const;

/**
 * Foto real em 2 quadros (loop de 850 ms só quando visível, com a aba ativa e sem reduced motion)
 * + ilustração anatômica lado a lado (§12). Falha de imagem → só a ilustração, sem log.
 */
export function ExerciseMedia({ baseUrl, mediaId, alt, animate, showPhotos, anatomy, onOpen, index, className }: ExerciseMediaProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const inView = useInView(rootRef, { rootMargin: '100px' });
  const documentVisible = useDocumentVisible();
  const reducedMotion = usePrefersReducedMotion();
  const [frame, setFrame] = useState<0 | 1>(0);
  const [failedFor, setFailedFor] = useState<string | null>(null);

  const src = baseUrl ? `${baseUrl}/${mediaId}` : null;
  const failed = failedFor !== null && failedFor === src;
  const withPhoto = showPhotos && src !== null && !failed;
  const looping = withPhoto && animate && inView && documentVisible && !reducedMotion;
  const shownFrame: 0 | 1 = looping ? frame : 0;

  useEffect(() => {
    if (!looping) return;
    const handle = window.setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), FRAME_MS);
    return () => window.clearInterval(handle);
  }, [looping]);

  // Pré-carrega o quadro 1 quando o card entra em vista (sem pré-carregamento global).
  useEffect(() => {
    if (!withPhoto || !inView || !baseUrl) return;
    const img = new Image();
    img.src = mediaUrl(baseUrl, mediaId, 1);
  }, [withPhoto, inView, baseUrl, mediaId]);

  return (
    <button
      ref={rootRef}
      type="button"
      className={cx(s.media, !withPhoto && s.single, className)}
      onClick={onOpen}
      aria-label={`Ver quadros de ${alt}`}
    >
      {withPhoto && baseUrl && (
        <span className={s.photo}>
          <img
            className={s.img}
            src={mediaUrl(baseUrl, mediaId, shownFrame)}
            alt={alt}
            width={320}
            height={240}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setFailedFor(src)}
          />
          <span className={s.phase}>{PHASE_LABELS[shownFrame]}</span>
        </span>
      )}
      <span className={s.illustration}>
        <AnatomyIllustration type={anatomy} />
        <span className={s.guide}>Guia Biomecânico</span>
      </span>
    </button>
  );
}

import { useState } from 'react';
import { Video } from 'lucide-react';
import { resolveExercise, type Equipment, type Exercise } from '../../plans/types';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { Modal } from '../ui/Modal';
import { AnatomyIllustration } from './AnatomyIllustration';
import { mediaUrl, videoUrl } from './media';
import s from './ExerciseDetailSheet.module.css';

export interface ExerciseDetailSheetProps {
  /** null = fechado. */
  exercise: Exercise | null;
  equipment: Equipment;
  /** plan.mediaBaseUrl; ausente → só a ilustração no lugar das fotos. */
  baseUrl?: string;
  onClose: () => void;
}

const FRAMES = [
  { frame: 0, caption: '1. Posição inicial' },
  { frame: 1, caption: '2. Fase de contração' },
] as const;

function DetailContent({ exercise, equipment, baseUrl }: { exercise: Exercise; equipment: Equipment; baseUrl?: string }) {
  const resolved = resolveExercise(exercise, equipment);
  const [failed, setFailed] = useState(false);
  const withPhotos = Boolean(baseUrl) && !failed;

  return (
    <div className={s.content}>
      <Chip size="sm" className={s.muscle}>
        {exercise.muscleGroup}
      </Chip>

      {withPhotos && baseUrl ? (
        <div className={s.frames}>
          {FRAMES.map(({ frame, caption }) => (
            <figure key={frame} className={s.figure}>
              <img
                className={s.img}
                src={mediaUrl(baseUrl, resolved.mediaId, frame)}
                alt={`${resolved.name}: ${caption}`}
                width={320}
                height={240}
                decoding="async"
                onError={() => setFailed(true)}
              />
              <figcaption className={s.caption}>{caption}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className={s.illustration}>
          <AnatomyIllustration type={exercise.anatomy} />
        </div>
      )}

      <Badge tone="primary" className={s.target}>
        🎯 Meta: {exercise.target}
      </Badge>

      <section>
        <h3 className={s.heading}>Checklist de execução perfeita:</h3>
        <ul className={s.steps}>
          {exercise.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>

      {exercise.videoQuery && (
        <a className={s.link} href={videoUrl(exercise.videoQuery)} target="_blank" rel="noopener noreferrer">
          <Video size={18} aria-hidden="true" />
          Vídeo tutorial
        </a>
      )}
    </div>
  );
}

/** Sheet com os 2 quadros lado a lado (empilhados < 480 px), checklist, meta e vídeo (§10.4). */
export function ExerciseDetailSheet({ exercise, equipment, baseUrl, onClose }: ExerciseDetailSheetProps) {
  const title = exercise ? resolveExercise(exercise, equipment).name : '';
  return (
    <Modal open={exercise !== null} onClose={onClose} title={title} variant="sheet">
      {exercise && <DetailContent key={exercise.id} exercise={exercise} equipment={equipment} baseUrl={baseUrl} />}
    </Modal>
  );
}

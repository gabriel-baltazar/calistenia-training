import { CirclePlay, Images, Timer, Video } from 'lucide-react';
import { cx } from '../../lib/cx';
import { resolveExercise, type Equipment, type Exercise } from '../../plans/types';
import { useTimerActions } from '../../timer/TimerProvider';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { ExerciseMedia } from './ExerciseMedia';
import { SetToggle } from './SetToggle';
import { videoUrl } from './media';
import s from './ExerciseCard.module.css';

export interface ExerciseCardProps {
  exercise: Exercise;
  /** Posição na lista (0-based); o título mostra index + 1. */
  index: number;
  equipment: Equipment;
  showPhotos: boolean;
  animateMedia: boolean;
  baseUrl?: string;
  /** doneSets[s - 1] = série s marcada. */
  doneSets: boolean[];
  /** Alterna a série e devolve o novo valor (true = marcada). */
  onToggleSet: (set: number) => boolean;
  onOpenDetail: () => void;
}

export function ExerciseCard({
  exercise,
  index,
  equipment,
  showPhotos,
  animateMedia,
  baseUrl,
  doneSets,
  onToggleSet,
  onOpenDetail,
}: ExerciseCardProps) {
  const { startCountdown, startStopwatch } = useTimerActions();
  const resolved = resolveExercise(exercise, equipment);
  const timer = resolved.timer;
  const allDone = doneSets.length > 0 && doneSets.every(Boolean);

  function toggle(set: number) {
    // Marcar (false → true) inicia o descanso do exercício; desmarcar não mexe no timer.
    if (onToggleSet(set)) startCountdown(exercise.restSeconds);
  }

  return (
    <Card as="article" padding="md" className={cx(s.card, allDone && s.done)}>
      <ExerciseMedia
        baseUrl={baseUrl}
        mediaId={resolved.mediaId}
        alt={resolved.name}
        animate={animateMedia}
        showPhotos={showPhotos}
        anatomy={exercise.anatomy}
        onOpen={onOpenDetail}
        index={index}
      />

      <div className={s.meta}>
        {exercise.muscleGroups.map((group) => (
          <Chip key={group} size="sm">
            {group}
          </Chip>
        ))}
      </div>
      <Badge tone="primary" className={s.target}>
        🎯 Meta: {exercise.target}
      </Badge>

      <h3 className={cx(s.title, allDone && s.titleDone)}>
        {index + 1}. {resolved.name}
      </h3>

      <ol className={s.steps}>
        {exercise.instructions.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className={s.sets}>
        <span className={s.setsLabel}>Séries:</span>
        <div className={s.toggles}>
          {doneSets.map((done, i) => (
            <SetToggle key={i} set={i + 1} done={done} exerciseName={resolved.name} onToggle={() => toggle(i + 1)} />
          ))}
        </div>
      </div>

      <div className={s.actions}>
        <Button size="sm" variant="secondary" leftIcon={<Images size={16} />} onClick={onOpenDetail}>
          Ver quadros
        </Button>
        {exercise.videoQuery && (
          <a className={s.link} href={videoUrl(exercise.videoQuery)} target="_blank" rel="noopener noreferrer">
            <Video size={16} aria-hidden="true" />
            Vídeo tutorial
          </a>
        )}
        {timer?.kind === 'countdown' && (
          <Button size="sm" variant="ghost" leftIcon={<Timer size={16} />} onClick={() => startCountdown(timer.seconds)}>
            Iniciar {timer.seconds}s
          </Button>
        )}
        {timer?.kind === 'stopwatch' && (
          <Button size="sm" variant="ghost" leftIcon={<CirclePlay size={16} />} onClick={startStopwatch}>
            Cronômetro livre
          </Button>
        )}
      </div>
    </Card>
  );
}

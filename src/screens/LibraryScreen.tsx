import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { cx } from '../lib/cx';
import { getPlan, plans } from '../plans/registry';
import { resolveExercise, type Exercise, type ExerciseCategory } from '../plans/types';
import { useProgress } from '../progress/ProgressProvider';
import { ExerciseDetailSheet } from '../components/exercise/ExerciseDetailSheet';
import { ExerciseMedia } from '../components/exercise/ExerciseMedia';
import { MuscleMap } from '../components/exercise/MuscleMap';
import { videoUrl } from '../components/exercise/media';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Input } from '../components/ui/Input';
import c from './common.module.css';
import s from './LibraryScreen.module.css';

type CategoryFilter = 'all' | ExerciseCategory;

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'peito', label: 'Peito/Ombro/Tríceps' },
  { value: 'costas', label: 'Costas/Bíceps' },
  { value: 'pernas', label: 'Pernas/Glúteos' },
  { value: 'core', label: 'Abdômen/HIIT' },
];

/** Busca sem acento e sem caixa (melhoria em relação ao legado). */
const normalize = (text: string): string => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function LibraryScreen() {
  const { doc } = useProgress();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [mapOpen, setMapOpen] = useState(false);
  const [detail, setDetail] = useState<Exercise | null>(null);

  const plan = getPlan(doc.activePlanId) ?? plans[0] ?? null;
  const { equipment, showPhotos, animateMedia } = doc.settings;

  // Exercícios únicos do plano, deduplicados pelo nome resolvido no equipamento atual, na ordem de aparição.
  const unique = useMemo(() => {
    const seen = new Set<string>();
    const list: { exercise: Exercise; name: string; mediaId: string }[] = [];
    for (const planDay of plan?.days ?? []) {
      for (const exercise of planDay.exercises) {
        const resolved = resolveExercise(exercise, equipment);
        if (seen.has(resolved.name)) continue;
        seen.add(resolved.name);
        list.push({ exercise, name: resolved.name, mediaId: resolved.mediaId });
      }
    }
    return list;
  }, [plan, equipment]);

  const q = normalize(query.trim());
  const filtered = unique.filter(
    ({ exercise, name }) =>
      (category === 'all' || exercise.category === category) &&
      (q === '' || normalize(name).includes(q) || normalize(exercise.muscleGroup).includes(q)),
  );

  return (
    <div className={c.stack}>
      <PageHeader title="Biblioteca" subtitle="Todos os movimentos com fotos reais em loop e guia biomecânico." />

      <Input
        label="Buscar exercício"
        type="search"
        leftIcon={<Search size={18} />}
        placeholder="Buscar exercício (ex: flexão, barra, agachamento, abdômen)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />

      <div className={s.chips} role="group" aria-label="Filtrar por categoria">
        {CATEGORIES.map((cat) => (
          <Chip key={cat.value} selected={category === cat.value} onClick={() => setCategory(cat.value)}>
            {cat.label}
          </Chip>
        ))}
      </div>

      <Card padding="md" className={s.mapCard}>
        <button
          type="button"
          className={c.collapseButton}
          aria-expanded={mapOpen}
          aria-controls="mapa-muscular"
          onClick={() => setMapOpen((v) => !v)}
        >
          Mapa muscular
          <ChevronRight size={20} aria-hidden="true" className={cx(c.chevron, mapOpen && c.chevronOpen)} />
        </button>
        {mapOpen && (
          <div id="mapa-muscular" className={s.mapBody}>
            <div className={s.map}>
              <MuscleMap />
            </div>
            <p className={c.muted}>Em cada exercício você vê as fotos reais em movimento e o esquema corporal com setas indicativas.</p>
          </div>
        )}
      </Card>

      {filtered.length === 0 ? (
        <p className={s.empty}>Nenhum exercício encontrado para “{query.trim()}”.</p>
      ) : (
        <ul className={s.grid}>
          {filtered.map(({ exercise, name, mediaId }, i) => (
            <li key={name}>
              <Card as="article" padding="md" className={s.card}>
                <ExerciseMedia
                  baseUrl={plan?.mediaBaseUrl}
                  mediaId={mediaId}
                  alt={name}
                  animate={animateMedia}
                  showPhotos={showPhotos}
                  anatomy={exercise.anatomy}
                  onOpen={() => setDetail(exercise)}
                  index={i}
                />
                <p className={s.muscle}>{exercise.muscleGroup}</p>
                <h2 className={s.name}>
                  <button type="button" className={s.nameButton} onClick={() => setDetail(exercise)}>
                    {name}
                  </button>
                </h2>
                {exercise.instructions[0] && <p className={c.muted}>{exercise.instructions[0]}</p>}
                <footer className={s.footer}>
                  <span className={s.target}>{exercise.target}</span>
                  {exercise.videoQuery && (
                    <a className={s.video} href={videoUrl(exercise.videoQuery)} target="_blank" rel="noopener noreferrer">
                      Ver vídeo ▶
                    </a>
                  )}
                </footer>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ExerciseDetailSheet exercise={detail} equipment={equipment} baseUrl={plan?.mediaBaseUrl} onClose={() => setDetail(null)} />
    </div>
  );
}

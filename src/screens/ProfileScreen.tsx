import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Download, Dumbbell, Flame, History, LogOut, RotateCcw, Trophy, Upload } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import type { AuthProviderId } from '../auth/types';
import { formatDateTimeBR } from '../lib/dates';
import { getPlan } from '../plans/registry';
import type { Equipment } from '../plans/types';
import { useProgress } from '../progress/ProgressProvider';
import { activePlanProgress, history, planStats, streaks } from '../progress/selectors';
import { parseImportFile } from '../storage/exportImport';
import { LEGACY_PLAN_ID, migrateLegacyState, readLegacyRaw, type LegacyMigrationResult } from '../storage/legacyMigration';
import type { UserProgressDoc } from '../storage/types';
import { ResetPlanDialog } from '../components/plan/ResetPlanDialog';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProgressRing } from '../components/ui/ProgressRing';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatTile } from '../components/ui/StatTile';
import { Switch } from '../components/ui/Switch';
import { useToast } from '../components/ui/Toast';
import c from './common.module.css';
import s from './ProfileScreen.module.css';

const PROVIDER_LABEL: Record<AuthProviderId, string> = {
  google: 'Google',
  password: 'E-mail',
  local: 'Modo local',
};

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'bar', label: 'Com barra' },
  { value: 'none', label: 'Sem equipamento' },
];

const NOTHING_TO_IMPORT = 'Nada para importar do app antigo.';

const migrationMessage = (m: LegacyMigrationResult): string =>
  `Importamos seu progresso do app antigo: ${m.stats.days} dias e ${m.stats.sets} séries.`;

type PendingImport =
  | { kind: 'doc'; doc: UserProgressDoc; warnings: string[] }
  | { kind: 'legacy'; migration: LegacyMigrationResult; source: 'file' | 'legacy-app' };

export function ProfileScreen() {
  const { user, mode, signOut } = useAuth();
  const { doc, hasLegacyData, updateSettings, exportDoc, replaceDoc, applyLegacyMigration } = useProgress();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const plan = getPlan(doc.activePlanId);
  const progress = plan ? activePlanProgress(doc) : null;
  const legacyPlan = getPlan(LEGACY_PLAN_ID);
  const displayName = user?.displayName ?? 'Atleta';
  const { equipment, showPhotos, animateMedia, sound } = doc.settings;

  async function onFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await parseImportFile(file);
    if (result.kind === 'error') {
      // Erro esperado e recuperável: sem console.error.
      console.info('[import]', result.error);
      toast({ message: result.error, tone: 'error' });
      return;
    }
    if (result.kind === 'doc') setPendingImport({ kind: 'doc', doc: result.doc, warnings: result.warnings });
    else setPendingImport({ kind: 'legacy', migration: result.migration, source: 'file' });
  }

  function importFromLegacyApp() {
    const raw = readLegacyRaw();
    let migration: LegacyMigrationResult | null = null;
    if (raw !== null && legacyPlan) {
      try {
        migration = migrateLegacyState(JSON.parse(raw), legacyPlan, new Date());
      } catch {
        migration = null;
      }
    }
    if (!migration) {
      console.info('[import]', NOTHING_TO_IMPORT);
      toast({ message: NOTHING_TO_IMPORT, tone: 'info' });
      return;
    }
    setPendingImport({ kind: 'legacy', migration, source: 'legacy-app' });
  }

  function confirmImport() {
    const pending = pendingImport;
    setPendingImport(null);
    if (!pending) return;
    if (pending.kind === 'doc') {
      replaceDoc(pending.doc);
      toast({ message: 'Progresso importado.', tone: 'success' });
      if (pending.warnings.length > 0) toast({ message: pending.warnings.join(' '), tone: 'info', durationMs: 6000 });
      return;
    }
    applyLegacyMigration(pending.migration);
    if (pending.source === 'file') {
      toast({ message: 'Progresso importado.', tone: 'success' });
      toast({ message: migrationMessage(pending.migration), tone: 'info' });
    } else {
      toast({ message: migrationMessage(pending.migration), tone: 'success' });
    }
  }

  function onSignOut() {
    setSigningOut(true);
    signOut().catch(() => {
      setSigningOut(false);
      toast({ message: 'Não foi possível sair. Tente novamente.', tone: 'error' });
    });
  }

  const importMessage =
    pendingImport?.kind === 'legacy'
      ? `Isso substituirá seu progresso no ${legacyPlan?.name ?? 'plano'}. Continuar?`
      : 'Isso substituirá todo o seu progresso atual. Continuar?';

  const stats = plan && progress ? planStats(progress, plan) : null;
  const streak = plan && progress ? streaks(progress, plan) : null;
  const entries = plan && progress ? history(progress, plan) : [];

  return (
    <div className={c.stack}>
      <header className={s.header}>
        <Avatar name={displayName} photoURL={user?.photoURL} size={72} />
        <div className={s.identity}>
          <h1 className={s.name}>{displayName}</h1>
          <p className={c.muted}>{user?.email ?? 'Usuário local'}</p>
          {user && (
            <Badge tone={user.provider === 'local' ? 'neutral' : 'primary'} className={s.provider}>
              {PROVIDER_LABEL[user.provider]}
            </Badge>
          )}
        </div>
      </header>

      {plan && progress && stats && streak ? (
        <>
          <section className={c.section}>
            <h2 className={c.sectionTitle}>Seu progresso</h2>
            <div className={s.progress}>
              <ProgressRing
                value={stats.pct / 100}
                size={132}
                stroke={11}
                label={`${stats.pct}%`}
                sublabel={`${stats.daysDone}/${plan.durationDays} dias`}
                ariaLabel={`Progresso: ${stats.pct}%, ${stats.daysDone} de ${plan.durationDays} dias`}
              />
              <ul className={c.tiles}>
                <li>
                  <StatTile icon={<CalendarCheck size={18} />} label="Dias concluídos" value={stats.daysDone} />
                </li>
                <li>
                  <StatTile icon={<Dumbbell size={18} />} label="Séries feitas" value={stats.setsDone} />
                </li>
                <li>
                  <StatTile icon={<Flame size={18} />} label="Sequência atual" value={streak.current} />
                </li>
                <li>
                  <StatTile icon={<Trophy size={18} />} label="Melhor sequência" value={streak.best} />
                </li>
              </ul>
            </div>
          </section>

          <section className={c.section}>
            <h2 className={c.sectionTitle}>Histórico</h2>
            {entries.length === 0 ? (
              <p className={c.muted}>Nenhum treino concluído ainda.</p>
            ) : (
              <Card padding="none">
                <ul className={s.history}>
                  {entries.map((entry) => (
                    <li key={entry.day} className={s.historyItem}>
                      <History size={18} aria-hidden="true" className={s.historyIcon} />
                      <span className={s.historyText}>
                        <span className={s.historyTitle}>
                          Dia {entry.day} • {entry.title}
                        </span>
                        <span className={s.historyDate}>
                          {entry.completedAt ? formatDateTimeBR(entry.completedAt) : 'Importado do app antigo'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </>
      ) : (
        <Card padding="lg" className={s.noPlan}>
          <p>Nenhum plano ativo.</p>
          <Link to="/planos" className={c.linkButton}>
            Ver planos
          </Link>
        </Card>
      )}

      <section className={c.section}>
        <h2 className={c.sectionTitle}>Preferências</h2>
        <Card padding="md" className={s.prefs}>
          <SegmentedControl
            options={EQUIPMENT_OPTIONS}
            value={equipment}
            onChange={(value) => updateSettings({ equipment: value })}
            ariaLabel="Equipamento"
          />
          <Switch label="Mostrar fotos reais" checked={showPhotos} onChange={(v) => updateSettings({ showPhotos: v })} />
          <Switch label="Animar fotos dos exercícios" checked={animateMedia} onChange={(v) => updateSettings({ animateMedia: v })} />
          <Switch label="Sons do cronômetro" checked={sound} onChange={(v) => updateSettings({ sound: v })} />
        </Card>
      </section>

      <section className={c.section}>
        <h2 className={c.sectionTitle}>Planos</h2>
        <div>
          <Link to="/planos" className={c.linkButton}>
            Ver planos
          </Link>
        </div>
      </section>

      <section className={c.section}>
        <h2 className={c.sectionTitle}>Dados</h2>
        <div className={s.data}>
          <Button variant="secondary" leftIcon={<Download size={18} />} onClick={exportDoc}>
            Exportar progresso (JSON)
          </Button>
          <Button variant="secondary" leftIcon={<Upload size={18} />} onClick={() => fileRef.current?.click()}>
            Importar progresso
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onFileChosen}
          />
          {hasLegacyData && (
            <Button variant="secondary" leftIcon={<History size={18} />} onClick={importFromLegacyApp}>
              Importar do app antigo
            </Button>
          )}
          {plan && progress && (
            <Button variant="ghost" className={c.dangerGhost} leftIcon={<RotateCcw size={18} />} onClick={() => setConfirmReset(true)}>
              Zerar progresso do plano
            </Button>
          )}
        </div>
      </section>

      <Button variant="danger" size="lg" fullWidth leftIcon={<LogOut size={18} />} onClick={onSignOut} loading={signingOut}>
        Sair
      </Button>

      <footer className={s.footer}>
        <p>Calistenia Training v{__APP_VERSION__}</p>
        {mode === 'local' && <p>Modo local: os dados ficam só neste navegador e o login não é uma proteção real.</p>}
      </footer>

      <ConfirmDialog
        open={pendingImport !== null}
        title="Importar progresso"
        message={importMessage}
        confirmLabel="Substituir"
        onCancel={() => setPendingImport(null)}
        onConfirm={confirmImport}
      />
      <ResetPlanDialog open={confirmReset} onClose={() => setConfirmReset(false)} />
    </div>
  );
}

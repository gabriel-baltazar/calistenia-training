import { localISODate } from '../lib/dates';
import { plans as registryPlans } from '../plans/registry';
import type { TrainingPlan } from '../plans/types';
import { LEGACY_PLAN_ID, migrateLegacyState, type LegacyMigrationResult } from './legacyMigration';
import type { UserProgressDoc } from './types';
import { isPlainObject, validateProgressDoc } from './validate';

export const EXPORT_APP = 'calistenia-training';
export const EXPORT_KIND = 'progress-export';
export const MAX_IMPORT_BYTES = 1024 * 1024;

export interface ProgressExportFile {
  app: typeof EXPORT_APP;
  kind: typeof EXPORT_KIND;
  schemaVersion: 1;
  exportedAt: string;
  data: UserProgressDoc;
}

export type ImportParseResult =
  | { kind: 'doc'; doc: UserProgressDoc; warnings: string[] }
  | { kind: 'legacy'; migration: LegacyMigrationResult }
  | { kind: 'error'; error: string };

export const IMPORT_ERRORS = {
  tooLarge: 'Arquivo muito grande (máximo 1 MB).',
  invalidJson: 'O arquivo não é um JSON válido.',
  unsupportedVersion: 'Versão de arquivo não suportada.',
  nothingToImport: 'Nada para importar do app antigo.',
  unrecognized: 'Arquivo não reconhecido como backup do Calistenia Training.',
} as const;

export function buildExport(doc: UserProgressDoc, now: Date = new Date()): ProgressExportFile {
  return { app: EXPORT_APP, kind: EXPORT_KIND, schemaVersion: 1, exportedAt: now.toISOString(), data: doc };
}

/** Conteúdo do arquivo de export (JSON indentado). */
export function serializeExport(doc: UserProgressDoc, now: Date = new Date()): string {
  return JSON.stringify(buildExport(doc, now), null, 2);
}

/** calistenia-progresso-AAAA-MM-DD.json (data local). */
export function exportFileName(now: Date = new Date()): string {
  return `calistenia-progresso-${localISODate(now)}.json`;
}

/**
 * Lê um arquivo de backup: export deste app (→ doc validado no modo import) ou estado do app antigo
 * (→ migração). Nunca lança por conteúdo inválido: devolve { kind: 'error', error } com a mensagem pt-BR.
 */
export async function parseImportFile(
  file: Blob,
  plans: readonly TrainingPlan[] = registryPlans,
  today: Date = new Date(),
): Promise<ImportParseResult> {
  // 1. Tamanho
  if (file.size > MAX_IMPORT_BYTES) return { kind: 'error', error: IMPORT_ERRORS.tooLarge };

  // 2. JSON
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return { kind: 'error', error: IMPORT_ERRORS.invalidJson };
  }

  // 3. Export deste app
  if (isPlainObject(json) && json.app === EXPORT_APP) {
    if (json.kind !== EXPORT_KIND || json.schemaVersion !== 1) return { kind: 'error', error: IMPORT_ERRORS.unsupportedVersion };
    const result = validateProgressDoc(json.data, plans, { mode: 'import' });
    if (!result.ok) return { kind: 'error', error: result.reason };
    return { kind: 'doc', doc: result.doc, warnings: result.warnings };
  }

  // 4. Estado do app antigo
  if (isPlainObject(json) && (isPlainObject(json.completedDays) || isPlainObject(json.completedSets))) {
    const plan = plans.find((p) => p.id === LEGACY_PLAN_ID);
    const migration = plan ? migrateLegacyState(json, plan, today) : null;
    if (!migration) return { kind: 'error', error: IMPORT_ERRORS.nothingToImport };
    return { kind: 'legacy', migration };
  }

  // 5. Desconhecido
  return { kind: 'error', error: IMPORT_ERRORS.unrecognized };
}

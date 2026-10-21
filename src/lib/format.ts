/** Milissegundos → "mm:ss" (arredonda para cima, para o visor não mostrar 00:00 antes do fim). */
export function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Escolhe singular/plural em pt-BR (1 → singular; 0 e demais → plural). */
export function plural(n: number, singular: string, pluralForm: string): string {
  return Math.abs(n) === 1 ? singular : pluralForm;
}

/** "1 dia", "3 dias". */
export function countLabel(n: number, singular: string, pluralForm: string): string {
  return `${n} ${plural(n, singular, pluralForm)}`;
}

export const pluralDays = (n: number): string => countLabel(n, 'dia', 'dias');
export const pluralSets = (n: number): string => countLabel(n, 'série', 'séries');
export const pluralSeconds = (n: number): string => countLabel(n, 'segundo', 'segundos');

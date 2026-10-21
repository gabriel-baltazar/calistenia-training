export type ClassValue = string | false | null | undefined | 0;

/** Junta classes ignorando valores falsos: cx('glass', s.nav, active && s.active). */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

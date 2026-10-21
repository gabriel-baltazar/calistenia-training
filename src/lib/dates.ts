const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Data local (não UTC) no formato AAAA-MM-DD. */
export function localISODate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Converte AAAA-MM-DD em timestamp UTC ao meio-dia (imune a horário de verão). Null se inválida. */
export function isoToUtcNoon(iso: string): number | null {
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d, 12);
  const check = new Date(t);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return t;
}

export function isValidISODate(iso: string): boolean {
  return isoToUtcNoon(iso) !== null;
}

/** Diferença em dias inteiros `to - from` (AAAA-MM-DD), calculada ao meio-dia UTC. */
export function diffDays(from: string, to: string): number {
  const a = isoToUtcNoon(from);
  const b = isoToUtcNoon(to);
  if (a === null || b === null) return Number.NaN;
  return Math.round((b - a) / DAY_MS);
}

/** Soma `days` a uma data AAAA-MM-DD. */
export function addDays(iso: string, days: number): string {
  const t = isoToUtcNoon(iso);
  if (t === null) return iso;
  const d = new Date(t + days * DAY_MS);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** AAAA-MM-DD → DD/MM/AAAA. */
export function formatDateBR(iso: string): string {
  const m = ISO_DATE.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** ISO completo (timestamp) → "DD/MM/AAAA às HH:MM" no fuso local. */
export function formatDateTimeBR(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return isoDateTime;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} às ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

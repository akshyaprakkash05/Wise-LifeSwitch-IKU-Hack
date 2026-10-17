const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);

export function isValidIsoDate(iso: string | null | undefined): iso is string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = parse(iso);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/** "1 Aug" */
export function shortDate(iso: string): string {
  const d = parse(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "1 August 2026" */
export function longDate(iso: string): string {
  const d = parse(iso);
  return `${d.getUTCDate()} ${LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

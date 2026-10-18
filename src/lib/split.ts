/**
 * Group Split maths, shared by browser and server. Amounts are integer minor
 * units (pence). The server recomputes shares itself; it never trusts totals
 * sent by the browser.
 */

export interface ReceiptLine {
  name: string;
  /** price for this line in minor units (quantity already applied) */
  amount_minor: number;
  /** people who shared this line; split equally between them */
  people: string[];
}

export interface Receipt {
  merchant: string;
  currency: string;
  lines: ReceiptLine[];
  /** service charge, tax, tip: spread in proportion to what each person ordered */
  extras_minor: number;
}

export interface Share {
  person: string;
  amount_minor: number;
  items: string[];
}

export function computeShares(r: Receipt, people: string[]): Share[] {
  const base = new Map<string, number>(people.map((p) => [p, 0]));
  const items = new Map<string, string[]>(people.map((p) => [p, []]));

  for (const line of r.lines) {
    const who = line.people.filter((p) => base.has(p));
    if (!who.length) continue;
    const each = Math.floor(line.amount_minor / who.length);
    let leftover = line.amount_minor - each * who.length;
    for (const p of who) {
      base.set(p, base.get(p)! + each + (leftover-- > 0 ? 1 : 0));
      items.get(p)!.push(who.length > 1 ? `${line.name} (shared)` : line.name);
    }
  }

  const subtotal = [...base.values()].reduce((a, b) => a + b, 0);
  const shares = people.map((p) => {
    const own = base.get(p)!;
    const extra = subtotal ? Math.round((r.extras_minor * own) / subtotal) : 0;
    return { person: p, amount_minor: own + extra, items: items.get(p)! };
  });

  // Make the shares add up to exactly what was assigned plus extras.
  const target = subtotal + (subtotal ? r.extras_minor : 0);
  const diff = target - shares.reduce((a, s) => a + s.amount_minor, 0);
  const biggest = shares.reduce((a, s) => (s.amount_minor > a.amount_minor ? s : a), shares[0]);
  if (biggest) biggest.amount_minor += diff;
  return shares;
}

export const unassigned = (r: Receipt) => r.lines.filter((l) => l.people.length === 0);
export const toMajor = (minor: number) => minor / 100;
export const toMinor = (major: number) => Math.round(major * 100);

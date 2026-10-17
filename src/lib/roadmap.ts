import { DEMO_TODAY } from "./demo-data";
import type { ItemStatus, RoadmapItem } from "./types";

export function needsReference(item: RoadmapItem, references: Record<string, string>): boolean {
  return item.flag === "missing-reference" && !(references[item.id] || item.reference);
}

export function referenceFor(item: RoadmapItem, references: Record<string, string>): string {
  return references[item.id] || item.reference;
}

export function statusOf(item: RoadmapItem, paid: boolean, references: Record<string, string>): ItemStatus {
  if (paid) return { key: "done", label: "Paid", pill: "p-ok", dot: "ok" };
  if (needsReference(item, references)) return { key: "warn", label: "Needs attention", pill: "p-warn", dot: "warn" };
  if (item.ready) return { key: "up", label: "Ready to pay", pill: "p-ready", dot: "ready" };
  if (item.recurring) return { key: "up", label: "Reminder set", pill: "p-idle", dot: "" };
  return { key: "up", label: "Upcoming", pill: "p-idle", dot: "" };
}

const DAY_MS = 86_400_000;

export function daysUntil(isoDate: string, today: string = DEMO_TODAY): number {
  return Math.round((Date.parse(isoDate) - Date.parse(today)) / DAY_MS);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayAndMonth(isoDate: string): { day: string; month: string } {
  const d = new Date(isoDate + "T00:00:00Z");
  return {
    day: String(d.getUTCDate()),
    month: MONTHS[d.getUTCMonth()],
  };
}

export function summarise(items: RoadmapItem[], paid: Record<string, boolean>) {
  const total = items.reduce((sum, i) => sum + i.amountGbp, 0);
  const paidItems = items.filter((i) => paid[i.id]);
  const paidAmount = paidItems.reduce((sum, i) => sum + i.amountGbp, 0);
  const sorted = [...items].sort((a, b) => a.due.localeCompare(b.due));
  return {
    total,
    paidAmount,
    paidCount: paidItems.length,
    percent: total ? Math.round((paidAmount / total) * 100) : 0,
    next: sorted.find((i) => !paid[i.id]) ?? null,
    sorted,
  };
}

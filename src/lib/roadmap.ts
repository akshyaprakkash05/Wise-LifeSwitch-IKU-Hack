import type { DisplayState, ItemCategory, RoadmapItem } from "./types";

const DAY = 864e5;

export function daysUntil(isoDate: string, now = new Date()): number {
  const due = new Date(isoDate + "T12:00:00");
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / DAY);
}

export function displayState(item: RoadmapItem, now = new Date()): DisplayState {
  if (item.status === "paid") return "paid";
  if (!item.due_date) return "no_date";
  const d = daysUntil(item.due_date, now);
  if (d < 0) return "overdue";
  if (d <= 7) return "due_soon";
  return "upcoming";
}

export function dueLabel(item: RoadmapItem, now = new Date()): string {
  if (item.status === "paid") return "Paid";
  if (!item.due_date) return item.recurring === "monthly" ? "Every month" : "No date found";
  const d = daysUntil(item.due_date, now);
  if (d < 0) return `${Math.abs(d)} day${d === -1 ? "" : "s"} overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `In ${d} days`;
}

export function formatDate(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Date(isoDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Dated items first (soonest first), undated estimates last. */
export function sortRoadmap(items: RoadmapItem[]) {
  return [...items].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
}

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  tuition: "Tuition",
  housing: "Rent",
  deposit: "Deposits",
  visa: "Visa",
  living: "Living",
  travel: "Travel",
  other: "Other",
};

export interface BudgetSummary {
  /** One-off payments still to make, in destination currency */
  remaining: number;
  paid: number;
  total: number;
  monthly: number;
  byCategory: { category: ItemCategory; amount: number }[];
  warnings: number;
}

/**
 * Budget in the destination currency. Assumes items are in that currency;
 * items in another currency are skipped from totals (Doc AI can convert later).
 */
export function budget(items: RoadmapItem[], currency: string): BudgetSummary {
  const inCcy = items.filter((i) => i.currency === currency);
  const oneOff = inCcy.filter((i) => !i.estimate);
  const paid = oneOff.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const total = oneOff.reduce((s, i) => s + i.amount, 0);
  const monthly = inCcy.filter((i) => i.recurring === "monthly").reduce((s, i) => s + i.amount, 0);
  const cats = new Map<ItemCategory, number>();
  oneOff.forEach((i) => cats.set(i.category, (cats.get(i.category) ?? 0) + i.amount));
  return {
    remaining: total - paid,
    paid,
    total,
    monthly,
    byCategory: [...cats.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    warnings: items.filter((i) => i.status !== "paid" && i.missing_info.length > 0).length,
  };
}

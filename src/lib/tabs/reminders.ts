// Reminders tab logic. Pure functions, unit tested.

import { DEMO_TODAY } from "@/lib/demo-data";
import { daysUntil } from "@/lib/roadmap";
import type { RoadmapItem } from "@/lib/types";
import { shortDate } from "./dates";
import type { CustomReminder } from "./types";

export interface ReminderRow {
  id: string;
  title: string;
  amountGbp: number;
  when: string;
  repeats: "once" | "weekly" | "monthly";
  fromDocuments: boolean;
  enabled: boolean;
  itemId?: string;
}

/** Every unpaid roadmap item gets a reminder (on by default), followed by the student's own reminders. */
export function reminderRows(items: RoadmapItem[], paid: Record<string, boolean>, off: Record<string, boolean>, custom: CustomReminder[]): ReminderRow[] {
  const fromItems = [...items]
    .filter((i) => !paid[i.id])
    .sort((a, b) => a.due.localeCompare(b.due))
    .map<ReminderRow>((i) => ({
      id: i.id,
      title: i.recurring ? i.title.replace(/^First month[’']s rent$/i, "Rent") : i.title,
      amountGbp: i.amountGbp,
      when: i.recurring ? "1st of each month" : shortDate(i.due),
      repeats: i.recurring ? "monthly" : "once",
      fromDocuments: true,
      enabled: !off[i.id],
      itemId: i.id,
    }));
  const own = custom.map<ReminderRow>((r) => ({ id: r.id, title: r.title, amountGbp: r.amountGbp, when: r.when, repeats: r.repeats, fromDocuments: false, enabled: r.enabled }));
  return [...fromItems, ...own];
}

export interface DueReminder {
  item: RoadmapItem;
  days: number;
}

/** What "Trigger demo reminder" fires: the soonest unpaid payment whose reminder is on. */
export function nextDue(items: RoadmapItem[], paid: Record<string, boolean>, off: Record<string, boolean>, today: string = DEMO_TODAY): DueReminder | null {
  const due = items
    .filter((i) => !paid[i.id] && !off[i.id])
    .map((item) => ({ item, days: daysUntil(item.due, today) }))
    .sort((a, b) => a.days - b.days);
  return due[0] ?? null;
}

export interface ReminderDraft {
  title: string;
  amount: string;
  repeats: "once" | "weekly" | "monthly";
  when: string;
}

export function validateReminder(d: ReminderDraft): { title?: true; amount?: true; when?: true } {
  const errs: { title?: true; amount?: true; when?: true } = {};
  if (!d.title.trim()) errs.title = true;
  const n = Number(d.amount);
  if (!d.amount.trim() || !Number.isFinite(n) || n <= 0 || n > 1_000_000) errs.amount = true;
  if (!d.when.trim()) errs.when = true;
  return errs;
}

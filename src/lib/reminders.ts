import { daysUntil } from "./roadmap";
import type { ManualReminder, ReminderView, RoadmapItem } from "./types";

/** How many days before a due date the pop-up appears. */
export const POPUP_WINDOW_DAYS = 3;

/** Unpaid roadmap items with a date, plus the user's own reminders, soonest first. */
export function buildReminders(items: RoadmapItem[], manual: ManualReminder[]): ReminderView[] {
  const fromRoadmap: ReminderView[] = items
    .filter((i) => i.status !== "paid" && i.due_date && !i.estimate)
    .map((i) => ({
      id: `item:${i.id}`,
      source: "roadmap",
      title: i.title,
      amount: i.amount,
      currency: i.currency,
      due_date: i.due_date!,
      recurring: i.recurring ?? null,
      itemId: i.id,
    }));
  const fromManual: ReminderView[] = manual.map((r) => ({ ...r, id: `manual:${r.id}`, source: "manual" }));
  return [...fromRoadmap, ...fromManual].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/** The reminder to pop up now: due within the window (or overdue) and not dismissed for this due date. */
export function popupReminder(views: ReminderView[], dismissed: Record<string, string>, now = new Date()) {
  return views.find((r) => daysUntil(r.due_date, now) <= POPUP_WINDOW_DAYS && dismissed[r.id] !== r.due_date) ?? null;
}

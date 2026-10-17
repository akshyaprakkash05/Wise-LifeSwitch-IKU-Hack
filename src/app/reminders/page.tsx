"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, Plus, Repeat, Trash2 } from "lucide-react";
import { Button, Card, Eyebrow, PageHeader, Pill } from "@/components/ui";
import { ReminderPopup } from "@/components/reminder-popup";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/countries";
import { buildReminders } from "@/lib/reminders";
import { daysUntil, formatDate } from "@/lib/roadmap";
import type { CurrencyCode, ReminderView } from "@/lib/types";

export default function RemindersPage() {
  const { ready, profile, items, reminders, addReminder, removeReminder, completeReminder } = useStore();
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<ReminderView | null>(null);
  const currency: CurrencyCode = profile?.destination.currency ?? "GBP";

  if (!ready) return null;
  const views = buildReminders(items, reminders);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") || "").trim();
    const amount = Number(String(f.get("amount") || "").replace(/[^\d.]/g, ""));
    const due = String(f.get("due") || "");
    if (!title || !amount || !due) return;
    addReminder({ title, amount, currency, due_date: due, recurring: f.get("monthly") ? "monthly" : null });
    setAdding(false);
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Smart payment reminders"
        title="Reminders"
        lead="Every payment from your roadmap, plus your own bills. We nudge you a few days before each one."
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => setAdding((a) => !a)}><Plus size={18} aria-hidden /> Add a bill</Button>
        {views[0] && (
          <Button variant="ghost" onClick={() => setPreview(views[0])}><BellRing size={18} aria-hidden /> Show a reminder now</Button>
        )}
      </div>

      {adding && (
        <Card>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
              What is it?
              <input id="rem-title" name="title" required placeholder="e.g. Rent, phone, gym" className="rounded-xl border border-line bg-bg px-3 py-2.5" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Amount ({currency})
              <input id="rem-amount" name="amount" required inputMode="decimal" className="rounded-xl border border-line bg-bg px-3 py-2.5" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Next due
              <input id="rem-due" name="due" type="date" required className="rounded-xl border border-line bg-bg px-3 py-2.5" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input id="rem-monthly" name="monthly" type="checkbox" defaultChecked className="size-5 accent-[var(--color-forest)]" />
              Repeats every month
            </label>
            <Button type="submit" className="sm:col-span-2">Save reminder</Button>
          </form>
        </Card>
      )}

      {views.length === 0 && <Card><p className="text-muted">No upcoming payments. Add a bill, or upload a document to fill your roadmap.</p></Card>}

      <ol className="grid gap-2">
        {views.map((r) => {
          const d = daysUntil(r.due_date);
          const tone = d < 0 ? "bad" : d <= 7 ? "warn" : "idle";
          const manualId = r.id.replace(/^manual:/, "");
          return (
            <li key={r.id}>
              <Card className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Eyebrow>{formatDate(r.due_date)}{r.source === "roadmap" ? " · from your documents" : ""}</Eyebrow>
                  <p className="truncate font-bold">{r.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Pill tone={tone}>{d < 0 ? `${-d}d overdue` : d === 0 ? "Today" : `In ${d}d`}</Pill>
                    {r.recurring === "monthly" && <Pill><Repeat size={12} aria-hidden /> Monthly</Pill>}
                  </div>
                </div>
                <p className="font-bold tabular">{formatMoney(r.amount, r.currency)}</p>
                {r.itemId ? (
                  <Link href={`/pay/${r.itemId}`} className="rounded-full bg-forest px-3 py-2 text-sm font-semibold text-white">Pay</Link>
                ) : (
                  <div className="flex">
                    <button type="button" onClick={() => completeReminder(manualId)} className="rounded-full bg-forest px-3 py-2 text-sm font-semibold text-white">Paid</button>
                    <button type="button" onClick={() => removeReminder(manualId)} aria-label={`Delete ${r.title}`} className="rounded-full p-2 text-muted hover:bg-sunk">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      {preview && <ReminderPopup force={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

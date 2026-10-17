"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/countries";
import { buildReminders, popupReminder } from "@/lib/reminders";
import { dueLabel } from "@/lib/roadmap";
import type { ReminderView } from "@/lib/types";

/** Slides up over any screen when a payment is due within a few days. */
export function ReminderPopup({ force, onClose }: { force?: ReminderView | null; onClose?: () => void }) {
  const router = useRouter();
  const path = usePathname();
  const { ready, items, reminders, dismissed, dismissReminder, completeReminder } = useStore();
  const payBtn = useRef<HTMLButtonElement>(null);

  const auto = ready && !path.startsWith("/pay/") ? popupReminder(buildReminders(items, reminders), dismissed) : null;
  const r = force ?? auto;

  useEffect(() => {
    if (r) payBtn.current?.focus();
  }, [r]);

  if (!r) return null;

  const close = () => {
    dismissReminder(r.id, r.due_date);
    onClose?.();
  };
  const act = () => {
    dismissReminder(r.id, r.due_date);
    onClose?.();
    if (r.itemId) router.push(`/pay/${r.itemId}`);
    else completeReminder(r.id.replace(/^manual:/, ""));
  };
  const label = dueLabel({ status: "todo", due_date: r.due_date, recurring: r.recurring } as never);

  return (
    <div className="fixed inset-0 z-40 grid items-end bg-ink/30 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:place-items-center" role="presentation">
      <div role="alertdialog" aria-labelledby="reminder-title" aria-describedby="reminder-desc" className="w-full max-w-md animate-rise rounded-[var(--radius-card)] bg-surface p-5 shadow-[var(--shadow-lift)]">
        <div className="mb-3 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
            <BellRing size={20} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-warn">{label}</p>
            <h2 id="reminder-title" className="text-xl font-bold">{r.title}</h2>
          </div>
          <button type="button" onClick={close} aria-label="Remind me later" className="rounded-full p-2 text-muted hover:bg-sunk">
            <X size={18} />
          </button>
        </div>
        <p id="reminder-desc" className="mb-4 text-muted">
          <span className="text-2xl font-extrabold tabular text-ink">{formatMoney(r.amount, r.currency)}</span>
          {r.recurring === "monthly" && " · every month"}
        </p>
        <div className="grid gap-2">
          <Button ref={payBtn} onClick={act}>{r.itemId ? "Pay with Wise" : "Mark as paid"}</Button>
          <Button variant="ghost" onClick={close}>Remind me later</Button>
        </div>
      </div>
    </div>
  );
}

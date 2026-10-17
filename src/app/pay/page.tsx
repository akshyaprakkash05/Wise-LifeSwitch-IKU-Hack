"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, Eyebrow, PageHeader, Pill } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/countries";
import { dueLabel, sortRoadmap } from "@/lib/roadmap";

export default function PayPage() {
  const { ready, items } = useStore();
  if (!ready) return null;
  const toPay = sortRoadmap(items).filter((i) => i.status !== "paid" && !i.estimate);
  const paid = items.filter((i) => i.status === "paid");

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Wise payment preparation" title="Ready to pay" lead="Each payment is filled in from your documents. Check it, then confirm." />
      {toPay.length === 0 && <Card><p className="text-muted">Nothing left to pay. Nice.</p></Card>}
      <ul className="grid gap-3">
        {toPay.map((i) => (
          <li key={i.id}>
            <Link href={`/pay/${i.id}`}>
              <Card className="flex items-center gap-3 hover:bg-sunk">
                <div className="min-w-0 flex-1">
                  <Eyebrow>{dueLabel(i)}</Eyebrow>
                  <p className="truncate font-bold">{i.title}</p>
                  <p className="truncate text-sm text-muted">{i.payee}</p>
                </div>
                <span className="font-bold tabular">{formatMoney(i.amount, i.currency)}</span>
                <ChevronRight aria-hidden />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {paid.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-lg font-bold">Paid</h2>
          {paid.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm">
              <span>{i.title}</span>
              <Pill tone="good">{formatMoney(i.amount, i.currency)}</Pill>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

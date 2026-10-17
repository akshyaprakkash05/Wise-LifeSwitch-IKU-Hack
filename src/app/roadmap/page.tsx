"use client";

import Link from "next/link";
import { AlertTriangle, ChevronRight, FileUp, Repeat } from "lucide-react";
import { ButtonLink, Card, Eyebrow, PageHeader, Pill } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useFx } from "@/lib/useFx";
import { formatMoney } from "@/lib/countries";
import { budget, CATEGORY_LABEL, displayState, dueLabel, formatDate, sortRoadmap } from "@/lib/roadmap";
import type { DisplayState, RoadmapItem } from "@/lib/types";

const TONE: Record<DisplayState, "good" | "warn" | "bad" | "idle" | "accent"> = {
  paid: "good",
  overdue: "bad",
  due_soon: "warn",
  upcoming: "idle",
  no_date: "idle",
};

export default function RoadmapPage() {
  const { ready, profile, items } = useStore();
  const dest = profile?.destination.currency;
  const home = profile?.origin.currency;
  const fx = useFx(dest, home);

  if (!ready) return null;
  if (!profile) {
    return (
      <div className="grid gap-4">
        <PageHeader title="No roadmap yet" lead="Upload your first document to build your money plan." />
        <ButtonLink href="/upload">Upload documents</ButtonLink>
      </div>
    );
  }

  const b = budget(items, profile.destination.currency);
  const sorted = sortRoadmap(items);
  const next = sorted.find((i) => i.status !== "paid" && i.due_date);
  const inHome = (n: number) => formatMoney(n * fx.rate, profile.origin.currency, { compact: true });

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow={`${profile.origin.flag} ${profile.origin.name} → ${profile.destination.flag} ${profile.destination.name}`}
        title={`${profile.name === "You" ? "Your" : `${profile.name}'s`} money roadmap`}
      />

      <Card className="grid gap-4 bg-forest text-white">
        <div className="grid gap-1">
          <Eyebrow className="text-white/70">Still to pay before you settle in</Eyebrow>
          <p className="text-4xl font-extrabold tabular">{formatMoney(b.remaining, profile.destination.currency)}</p>
          <p className="tabular text-white/80">
            ≈ {inHome(b.remaining)} at {fx.rate.toFixed(2)} {home}/{dest}
            {fx.source === "fallback" && " (approximate rate)"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-white/15 pt-3 text-sm">
          <div>
            <p className="text-white/70">Paid</p>
            <p className="font-bold tabular">{formatMoney(b.paid, profile.destination.currency)}</p>
          </div>
          <div>
            <p className="text-white/70">Every month</p>
            <p className="font-bold tabular">{formatMoney(b.monthly, profile.destination.currency)}</p>
          </div>
          <div>
            <p className="text-white/70">Need attention</p>
            <p className="font-bold tabular">{b.warnings}</p>
          </div>
        </div>
      </Card>

      {next && (
        <Link href={`/pay/${next.id}`} className="block">
          <Card className="flex items-center gap-3 border-accent bg-accent/25">
            <div className="min-w-0 flex-1">
              <Eyebrow>Next up · {dueLabel(next)}</Eyebrow>
              <p className="truncate font-bold">{next.title}</p>
            </div>
            <span className="font-bold tabular">{formatMoney(next.amount, next.currency)}</span>
            <ChevronRight aria-hidden />
          </Card>
        </Link>
      )}

      <section className="grid gap-3">
        <h2 className="text-xl font-bold">Timeline</h2>
        {sorted.length === 0 && (
          <Card className="grid justify-items-start gap-3">
            <p className="text-muted">Nothing here yet. Upload a document and we&apos;ll find the payments in it.</p>
            <ButtonLink href="/upload" variant="ghost"><FileUp size={18} aria-hidden /> Upload documents</ButtonLink>
          </Card>
        )}
        <ol className="grid gap-3">
          {sorted.map((item) => (
            <li key={item.id}>
              <TimelineItem item={item} homeAmount={item.currency === dest ? inHome(item.amount) : null} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function TimelineItem({ item, homeAmount }: { item: RoadmapItem; homeAmount: string | null }) {
  const state = displayState(item);
  return (
    <Card className="grid gap-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Eyebrow>
            {CATEGORY_LABEL[item.category]}
            {item.due_date && ` · ${formatDate(item.due_date)}`}
          </Eyebrow>
          <h3 className="text-lg font-bold">{item.title}</h3>
          <p className="truncate text-sm text-muted">{item.payee}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular">{formatMoney(item.amount, item.currency)}</p>
          {homeAmount && <p className="text-sm tabular text-muted">≈ {homeAmount}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={TONE[state]}>{dueLabel(item)}</Pill>
        {item.recurring === "monthly" && <Pill><Repeat size={12} aria-hidden /> Monthly</Pill>}
        {item.estimate && <Pill>Estimate</Pill>}
      </div>

      {item.status !== "paid" &&
        item.missing_info.map((m) => (
          <p key={m} className="flex gap-2 rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> {m}
          </p>
        ))}

      {(item.explanation || item.source_snippet || item.requirements.length > 0) && (
        <details className="group text-sm">
          <summary className="cursor-pointer font-semibold text-forest">What is this?</summary>
          <div className="mt-2 grid gap-2">
            {item.explanation && <p>{item.explanation}</p>}
            {item.requirements.length > 0 && (
              <ul className="list-disc pl-5 text-muted">
                {item.requirements.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
            {item.source_snippet && (
              <blockquote className="border-l-2 border-accent pl-3 text-muted">
                “{item.source_snippet}”
                {item.document_name && <span className="block text-xs">From {item.document_name}</span>}
              </blockquote>
            )}
          </div>
        </details>
      )}

      {item.status !== "paid" && !item.estimate && (
        <ButtonLink href={`/pay/${item.id}`} variant="secondary" className="justify-self-start">
          Pay with Wise
        </ButtonLink>
      )}
    </Card>
  );
}

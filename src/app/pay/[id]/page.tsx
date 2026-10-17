"use client";

import { use, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button, ButtonLink, Card, Eyebrow, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useFx } from "@/lib/useFx";
import { formatMoney } from "@/lib/countries";
import { dueLabel } from "@/lib/roadmap";
import { getPaymentsService } from "@/lib/services/payments";
import { shareToCircle } from "@/lib/circle-client";
import type { Transfer } from "@/lib/types";

export default function PayItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, profile, items, markPaid } = useStore();
  const item = items.find((i) => i.id === id);
  const home = profile?.origin.currency;
  const fx = useFx(home, item?.currency);
  const [sent, setSent] = useState<Transfer | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = useMemo(() => {
    if (!item || !home) return null;
    const payments = getPaymentsService();
    const quote = payments.quote({
      sourceCurrency: home,
      targetCurrency: item.currency,
      targetAmount: item.amount,
      rate: fx.rate,
      rateSource: fx.source,
    });
    return payments.createTransfer(item, quote);
  }, [item, home, fx.rate, fx.source]);

  if (!ready) return null;
  if (!item || !profile || !draft) {
    return (
      <div className="grid gap-4">
        <PageHeader title="Payment not found" lead="It may have been removed from your roadmap." />
        <ButtonLink href="/roadmap">Back to roadmap</ButtonLink>
      </div>
    );
  }

  async function confirm() {
    if (!draft) return;
    setSending(true);
    setError(null);
    try {
      const done = await getPaymentsService().confirmTransfer(draft);
      markPaid(item!.id);
      setSent(done);
      shareToCircle("payment", `paid the ${item!.title.toLowerCase()} (${formatMoney(item!.amount, item!.currency)})`);
    } catch (err) {
      setError((err as Error).message || "The transfer didn't go through. Nothing was sent.");
    } finally {
      setSending(false);
    }
  }

  const q = (sent ?? draft).quote;

  if (sent || item.status === "paid") {
    return (
      <div className="grid gap-5 animate-rise">
        <Card className="grid justify-items-center gap-3 py-10 text-center">
          <CheckCircle2 size={48} className="text-good" aria-hidden />
          <h1 className="text-3xl font-extrabold">Sent</h1>
          <p className="max-w-[36ch] text-muted">
            {formatMoney(q.targetAmount, q.targetCurrency)} to {item.payee}
            {item.reference && <> with reference <strong className="text-ink">{item.reference}</strong></>}. {q.estimatedDelivery}.
          </p>
          <p className="text-sm text-muted">If you&apos;re sharing with your Circle, they&apos;ll see it&apos;s paid.</p>
        </Card>
        <ButtonLink href="/roadmap">Back to roadmap</ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow={`Pay with Wise · ${dueLabel(item)}`} title={item.title} lead={`To ${item.payee}`} />

      <Card className="grid gap-4">
        <Row label="You send" value={formatMoney(q.sourceAmount, q.sourceCurrency)} big />
        <Row label="Fee (included)" value={formatMoney(q.fee, q.sourceCurrency)} />
        <Row
          label="Exchange rate"
          value={`1 ${q.sourceCurrency} = ${q.rate.toFixed(5)} ${q.targetCurrency}`}
          note={q.rateSource === "live" ? "Live mid-market rate" : "Approximate rate (live rate unavailable)"}
        />
        <div className="border-t border-line" />
        <Row label={`${item.payee} gets`} value={formatMoney(q.targetAmount, q.targetCurrency)} big />
        <Row label="Reference" value={item.reference ?? "None"} />
        <Row label="Arrives" value={q.estimatedDelivery} />
      </Card>

      {item.missing_info.map((m) => (
        <p key={m} className="flex gap-2 rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> {m}
        </p>
      ))}

      <p className="flex items-start gap-2 text-sm text-muted">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
        Nothing is sent until you confirm. Demo mode: this transfer is simulated and no real money moves.
      </p>

      {error && <p className="text-sm text-bad">{error}</p>}

      <Button onClick={confirm} disabled={sending}>
        {sending ? <><Loader2 size={18} className="animate-spin" aria-hidden /> Sending…</> : <>Confirm and send {formatMoney(q.sourceAmount, q.sourceCurrency)}</>}
      </Button>
      <ButtonLink href="/roadmap" variant="ghost">Not now</ButtonLink>
    </div>
  );
}

function Row({ label, value, note, big }: { label: string; value: string; note?: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div>
        <p className="text-sm text-muted">{label}</p>
        {note && <Eyebrow>{note}</Eyebrow>}
      </div>
      <p className={big ? "text-2xl font-extrabold tabular" : "font-semibold tabular"}>{value}</p>
    </div>
  );
}

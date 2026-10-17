"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, Loader2, Share2 } from "lucide-react";
import { Button, Card, Eyebrow, PageHeader, Pill } from "@/components/ui";
import { ApplePayButton } from "@/components/apple-pay-button";
import { shareToCircle } from "@/lib/circle-client";
import { toMajor } from "@/lib/split";
import { formatMoney } from "@/lib/countries";
import type { CurrencyCode } from "@/lib/types";
import type { SplitView } from "@/lib/server/split";

const money = (minor: number, ccy: string) => formatMoney(toMajor(minor), ccy as CurrencyCode);

export default function SplitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = useSearchParams().get("new") === "1";
  const [split, setSplit] = useState<SplitView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [walletMissing, setWalletMissing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/split/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setSplit(json);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id]);

  useEffect(() => {
    try {
      setMe(localStorage.getItem(`lifeswitch:split:${id}`));
    } catch {}
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 3000);
    return () => clearInterval(t);
  }, [id, load]);

  function pick(person: string | null) {
    setMe(person);
    try {
      if (person) localStorage.setItem(`lifeswitch:split:${id}`, person);
      else localStorage.removeItem(`lifeswitch:split:${id}`);
    } catch {}
  }

  async function shareLink() {
    const url = `${location.origin}/split/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: `Split: ${split?.merchant}`, text: "Here's your share. Tap to pay.", url });
      else await navigator.clipboard.writeText(url);
    } catch {}
  }

  if (error && !split) return <Card className="text-bad">{error}</Card>;
  if (!split) return <p className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={18} aria-hidden /> Loading…</p>;

  const mine = split.shares.find((s) => s.person === me);
  const paidCount = split.shares.filter((s) => s.status === "paid").length;

  async function startPayment() {
    const res = await fetch(`/api/split/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId: mine!.id }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json.clientSecret as string;
  }

  async function confirmPaid() {
    const res = await fetch(`/api/split/${id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId: mine!.id }),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    shareToCircle("payment", `paid their share at ${split!.merchant} (${money(mine!.amount_minor, split!.currency)})`);
    await load();
  }

  async function paidAnotherWay() {
    await fetch(`/api/split/${id}/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId: mine!.id }),
    });
    await load();
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow={`Group Split · paid by ${split.payer}`}
        title={split.merchant}
        lead={`${paidCount} of ${split.shares.length} paid`}
        action={<Button variant="ghost" onClick={shareLink}><Share2 size={18} aria-hidden /> Send link</Button>}
      />

      {isNew && me === split.payer && (
        <Card className="bg-accent/25 text-sm">Send this page to everyone. They pick their name and pay their share with Apple Pay. You&apos;ll see each payment arrive here.</Card>
      )}

      {!mine && (
        <Card className="grid gap-3">
          <h2 className="text-lg font-bold">Which one are you?</h2>
          <div className="flex flex-wrap gap-2">
            {split.shares.map((s) => (
              <Button key={s.id} variant="ghost" onClick={() => pick(s.person)}>{s.person}</Button>
            ))}
          </div>
        </Card>
      )}

      {mine && (
        <Card className={clsx("grid gap-3", mine.status === "paid" ? "border-good" : "border-forest")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Eyebrow>Your share, {mine.person}</Eyebrow>
              <p className="text-4xl font-extrabold tabular">{money(mine.amount_minor, split.currency)}</p>
            </div>
            <button type="button" className="text-sm text-muted underline" onClick={() => pick(null)}>Not you?</button>
          </div>
          <ul className="list-disc pl-5 text-sm text-muted">
            {mine.items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
          {mine.status === "paid" ? (
            <p className="flex items-center gap-2 font-semibold text-good">
              <CheckCircle2 aria-hidden /> {mine.person === split.payer ? "You paid the bill" : `Paid${mine.method ? ` with ${mine.method}` : ""}`}
            </p>
          ) : (
            <>
              <ApplePayButton
                amountMinor={mine.amount_minor}
                currency={split.currency}
                label={`Your share at ${split.merchant}`}
                createPayment={startPayment}
                onPaid={confirmPaid}
                onUnavailable={(r) =>
                  setWalletMissing(r === "no_key" ? "Card payments aren't set up on this server yet." : "Apple Pay isn't available here. Open this link in Safari on your iPhone.")
                }
              />
              {walletMissing && <p className="text-sm text-warn">{walletMissing}</p>}
              <button type="button" onClick={paidAnotherWay} className="justify-self-start text-sm text-muted underline">I paid {split.payer} another way</button>
              <p className="text-xs text-muted">Test mode: Apple Pay runs for real on your phone, but no money is taken.</p>
            </>
          )}
        </Card>
      )}

      <section className="grid gap-2" aria-live="polite">
        <h2 className="text-lg font-bold">Everyone</h2>
        {split.shares.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
            <span className="font-semibold">{s.person}</span>
            <span className="flex items-center gap-2">
              <span className="tabular">{money(s.amount_minor, split.currency)}</span>
              {s.status === "paid" ? <Pill tone="good">Paid</Pill> : <Pill>Waiting</Pill>}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

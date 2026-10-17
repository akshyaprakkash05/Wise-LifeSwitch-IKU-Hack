"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Camera, Loader2, Plus, Receipt as ReceiptIcon, X } from "lucide-react";
import { Button, Card, Eyebrow, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { circleApi, getMembership } from "@/lib/circle-client";
import { computeShares, toMajor, toMinor, unassigned, type Receipt } from "@/lib/split";
import { formatMoney } from "@/lib/countries";
import type { CurrencyCode } from "@/lib/types";

const money = (minor: number, ccy: string) => formatMoney(toMajor(minor), ccy as CurrencyCode);

export default function SplitPage() {
  const router = useRouter();
  const { profile } = useStore();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<string[]>([]);
  const [payer, setPayer] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Start with the Circle's members, or just "me".
  useEffect(() => {
    const me = profile && profile.name !== "You" ? profile.name : "Me";
    const m = getMembership();
    if (!m) {
      setPeople([me]);
      setPayer(me);
      return;
    }
    circleApi
      .feed(m.code)
      .then((f) => {
        const mine = f.members.find((x) => x.id === m.memberId)?.name ?? me;
        setPeople([mine, ...f.members.filter((x) => x.id !== m.memberId).map((x) => x.name)]);
        setPayer(mine);
      })
      .catch(() => {
        setPeople([me]);
        setPayer(me);
      });
  }, [profile]);

  async function scan(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setScanning(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/split/scan", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setReceipt({
        merchant: json.merchant,
        currency: json.currency,
        extras_minor: toMinor(json.extras),
        lines: json.lines.map((l: { name: string; amount: number }) => ({ name: l.name, amount_minor: toMinor(l.amount), people: [] })),
      });
    } catch (err) {
      setError((err as Error).message || "Couldn't read that receipt.");
    } finally {
      setScanning(false);
    }
  }

  const shares = useMemo(() => (receipt ? computeShares(receipt, people) : []), [receipt, people]);
  const missing = receipt ? unassigned(receipt).length : 0;

  function toggle(lineIdx: number, person: string) {
    setReceipt((r) =>
      r && {
        ...r,
        lines: r.lines.map((l, i) =>
          i !== lineIdx ? l : { ...l, people: l.people.includes(person) ? l.people.filter((p) => p !== person) : [...l.people, person] },
        ),
      },
    );
  }

  function addPerson(e: React.FormEvent) {
    e.preventDefault();
    const n = newName.trim();
    if (n && !people.includes(n)) setPeople((p) => [...p, n]);
    setNewName("");
  }

  function removePerson(name: string) {
    setPeople((p) => p.filter((x) => x !== name));
    setReceipt((r) => r && { ...r, lines: r.lines.map((l) => ({ ...l, people: l.people.filter((p) => p !== name) })) });
    if (payer === name) setPayer(people.find((p) => p !== name) ?? "");
  }

  async function create() {
    if (!receipt) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt, people, payer, circleCode: getMembership()?.code ?? null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      try {
        localStorage.setItem(`lifeswitch:split:${json.id}`, payer);
      } catch {}
      router.push(`/split/${json.id}?new=1`);
    } catch (err) {
      setError((err as Error).message);
      setCreating(false);
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader eyebrow="Group Split" title="Split a bill" lead="Snap the receipt, tap who had what. Everyone pays only for their own share, from their own phone." />

      {!receipt && (
        <label
          htmlFor="receipt-input"
          className="grid cursor-pointer place-items-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-line bg-surface px-6 py-12 text-center hover:bg-sunk"
        >
          {scanning ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
          <span className="font-semibold">{scanning ? "Reading the receipt…" : "Take a photo of the receipt"}</span>
          <input id="receipt-input" type="file" accept="image/*" capture="environment" className="sr-only" disabled={scanning} onChange={(e) => scan(e.target.files)} />
        </label>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}

      {receipt && (
        <>
          <Card className="grid gap-3">
            <Eyebrow>Who&apos;s splitting</Eyebrow>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 rounded-full bg-sunk py-1 pl-3 pr-1 text-sm font-semibold">
                  {p}
                  {people.length > 1 && (
                    <button type="button" onClick={() => removePerson(p)} aria-label={`Remove ${p}`} className="rounded-full p-1 hover:bg-line"><X size={14} /></button>
                  )}
                </span>
              ))}
            </div>
            <form onSubmit={addPerson} className="flex gap-2">
              <input id="new-person" aria-label="Add a person" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={30} placeholder="Add a flatmate" className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2" />
              <Button type="submit" variant="ghost" aria-label="Add person"><Plus size={18} /></Button>
            </form>
            <label className="grid gap-1 text-sm font-semibold">
              Who paid the bill?
              <select id="payer" value={payer} onChange={(e) => setPayer(e.target.value)} className="rounded-xl border border-line bg-bg px-3 py-2">
                {people.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
          </Card>

          <section className="grid gap-2">
            <div className="flex items-center gap-2">
              <ReceiptIcon size={18} aria-hidden />
              <h2 className="flex-1 text-lg font-bold">{receipt.merchant}</h2>
              <Button variant="ghost" className="min-h-9 px-3 py-1 text-sm" onClick={() => setReceipt((r) => r && { ...r, lines: r.lines.map((l) => ({ ...l, people: [...people] })) })}>
                Split everything evenly
              </Button>
            </div>
            <p className="text-sm text-muted">Tap the people who had each item. Shared items are split between them.</p>
            {receipt.lines.map((l, i) => (
              <Card key={i} className={clsx("grid gap-2 p-4", l.people.length === 0 && "border-warn")}>
                <div className="flex justify-between gap-3">
                  <p className="font-semibold">{l.name}</p>
                  <p className="font-bold tabular">{money(l.amount_minor, receipt.currency)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {people.map((p) => {
                    const on = l.people.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(i, p)}
                        className={clsx("rounded-full px-3 py-1.5 text-sm font-semibold", on ? "bg-forest text-white" : "bg-sunk text-muted")}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
            {receipt.extras_minor > 0 && (
              <p className="text-sm text-muted">Service and extras {money(receipt.extras_minor, receipt.currency)}, shared in proportion to what each person had.</p>
            )}
          </section>

          <Card className="grid gap-2">
            <Eyebrow>Each person pays</Eyebrow>
            {shares.map((s) => (
              <div key={s.person} className="flex justify-between">
                <span>{s.person}{s.person === payer && <span className="text-muted"> (paid the bill)</span>}</span>
                <span className="font-bold tabular">{money(s.amount_minor, receipt.currency)}</span>
              </div>
            ))}
          </Card>

          <div className="sticky bottom-24 z-10">
            <Button className="w-full shadow-[var(--shadow-lift)]" disabled={creating || missing > 0 || people.length < 2} onClick={create}>
              {creating && <Loader2 size={18} className="animate-spin" aria-hidden />}
              {people.length < 2 ? "Add at least one more person" : missing > 0 ? `Tag someone on ${missing} more item${missing === 1 ? "" : "s"}` : "Send everyone their share"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button, Card, Eyebrow, PageHeader, Pill } from "@/components/ui";
import { useStore } from "@/lib/store";
import { COUNTRIES, countryByCode, formatMoney } from "@/lib/countries";
import { CATEGORY_LABEL, formatDate } from "@/lib/roadmap";
import type { CurrencyCode, ExtractedItem } from "@/lib/types";

type Doc = { id: string; name: string; status: "reading" | "done" | "error"; message?: string; items: ExtractedItem[] };

const uid = () => Math.random().toString(36).slice(2, 10);
const CURRENCIES: CurrencyCode[] = ["GBP", "INR", "EUR", "USD", "CAD", "AUD", "NGN", "CNY", "PKR", "BRL"];

export default function UploadPage() {
  const router = useRouter();
  const { profile, setProfile, addExtracted, loadDemo } = useStore();
  const [origin, setOrigin] = useState(profile?.origin.code ?? "IN");
  const [destination, setDestination] = useState(profile?.destination.code ?? "GB");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [noKey, setNoKey] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const reading = docs.some((d) => d.status === "reading");
  const pending = docs.filter((d) => d.status === "done").flatMap((d) => d.items);

  async function readFiles(files: FileList | null) {
    if (!files?.length) return;
    const from = countryByCode(origin);
    const to = countryByCode(destination);
    for (const file of Array.from(files)) {
      const id = uid();
      setDocs((ds) => [...ds, { id, name: file.name, status: "reading", items: [] }]);
      const body = new FormData();
      body.append("file", file);
      body.append("origin", from.name);
      body.append("destination", to.name);
      try {
        const res = await fetch("/api/extract", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) {
          if (json.error === "no_key") setNoKey(true);
          throw new Error(json.message ?? "Couldn't read this document.");
        }
        setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, status: "done", items: json.items } : d)));
      } catch (err) {
        setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, status: "error", message: (err as Error).message } : d)));
      }
    }
    if (input.current) input.current.value = "";
  }

  function editItem(docId: string, index: number, patch: Partial<ExtractedItem>) {
    setDocs((ds) =>
      ds.map((d) => (d.id === docId ? { ...d, items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) } : d)),
    );
  }

  function dropItem(docId: string, index: number) {
    setDocs((ds) => ds.map((d) => (d.id === docId ? { ...d, items: d.items.filter((_, i) => i !== index) } : d)));
  }

  function confirmAll() {
    if (!profile) {
      setProfile({
        name: "You",
        origin: countryByCode(origin),
        destination: countryByCode(destination),
        purpose: "study",
        language: "en",
        createdAt: new Date().toISOString(),
      });
    }
    docs
      .filter((d) => d.status === "done" && d.items.length)
      .forEach((d) => addExtracted(d.items, { id: d.id, name: d.name }, { reviewed: true }));
    router.push("/roadmap");
  }

  return (
    <div className="grid gap-5">
      <PageHeader
        eyebrow="Smart Document Roadmap"
        title="Upload your documents"
        lead="Offer letter, CAS, tenancy agreement or fee invoice. A PDF or a photo both work. We find every payment, then you check it before it goes in your plan."
      />

      {!profile && (
        <Card className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Moving from
            <select id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} className="rounded-xl border border-line bg-bg px-3 py-2.5">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Moving to
            <select id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="rounded-xl border border-line bg-bg px-3 py-2.5">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </label>
        </Card>
      )}

      <label
        htmlFor="doc-input"
        className="grid cursor-pointer place-items-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-line bg-surface px-6 py-10 text-center hover:bg-sunk"
      >
        <Upload aria-hidden />
        <span className="font-semibold">Choose files or take a photo</span>
        <span className="text-sm text-muted">PDF, JPG, PNG or HEIC, up to 10 MB each</span>
        <input
          ref={input}
          id="doc-input"
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="sr-only"
          onChange={(e) => readFiles(e.target.files)}
        />
      </label>

      {noKey && (
        <Card className="grid gap-3 border-warn bg-warn-bg">
          <p className="font-semibold text-warn">The document reader isn&apos;t set up on this server yet.</p>
          <p className="text-sm">Add a Gemini API key to <code>.env.local</code> and restart, or load Priya&apos;s sample roadmap to see the rest of the app.</p>
          <Button variant="ghost" onClick={() => { loadDemo(); router.push("/roadmap"); }}>Load Priya&apos;s sample roadmap</Button>
        </Card>
      )}

      {docs.map((doc) => (
        <section key={doc.id} className="grid gap-3 animate-rise">
          <div className="flex items-center gap-2">
            <FileText size={18} aria-hidden />
            <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{doc.name}</h2>
            {doc.status === "reading" && <Pill><Loader2 size={12} className="animate-spin" aria-hidden /> Reading…</Pill>}
            {doc.status === "done" && <Pill tone="good"><Check size={12} aria-hidden /> {doc.items.length} found</Pill>}
            {doc.status === "error" && <Pill tone="bad">Couldn&apos;t read</Pill>}
          </div>
          {doc.status === "error" && <p className="text-sm text-bad">{doc.message}</p>}
          {doc.status === "done" && doc.items.length === 0 && (
            <p className="text-sm text-muted">No payments found in this document.</p>
          )}
          {doc.items.map((item, i) => (
            <ReviewCard
              key={i}
              id={`${doc.id}-${i}`}
              item={item}
              onChange={(patch) => editItem(doc.id, i, patch)}
              onRemove={() => dropItem(doc.id, i)}
            />
          ))}
        </section>
      ))}

      {pending.length > 0 && (
        <div className="sticky bottom-24 z-10">
          <Button className="w-full shadow-[var(--shadow-lift)]" disabled={reading} onClick={confirmAll}>
            <Check size={18} aria-hidden /> Looks right, add {pending.length} payment{pending.length === 1 ? "" : "s"} to my roadmap
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  id,
  item,
  onChange,
  onRemove,
}: {
  id: string;
  item: ExtractedItem;
  onChange: (p: Partial<ExtractedItem>) => void;
  onRemove: () => void;
}) {
  const field = "rounded-xl border border-line bg-bg px-3 py-2 text-[0.95rem]";
  return (
    <Card className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <Eyebrow>{CATEGORY_LABEL[item.category]}</Eyebrow>
          <input aria-label="Payment name" id={`${id}-title`} className="bg-transparent text-lg font-bold outline-none" value={item.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        <button type="button" onClick={onRemove} className="rounded-full p-2 text-muted hover:bg-sunk" aria-label={`Remove ${item.title}`}>
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="col-span-2 grid gap-1 text-xs font-semibold text-muted">
          Pay to
          <input id={`${id}-payee`} className={field} value={item.payee} onChange={(e) => onChange({ payee: e.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Amount
          <input id={`${id}-amount`} inputMode="decimal" className={`${field} tabular`} value={item.amount} onChange={(e) => onChange({ amount: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-muted">
          Currency
          <select id={`${id}-currency`} className={field} value={item.currency} onChange={(e) => onChange({ currency: e.target.value as CurrencyCode })}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="col-span-2 grid gap-1 text-xs font-semibold text-muted">
          Due date
          <input id={`${id}-due`} type="date" className={field} value={item.due_date ?? ""} onChange={(e) => onChange({ due_date: e.target.value || null })} />
        </label>
        <label className="col-span-2 grid gap-1 text-xs font-semibold text-muted">
          Payment reference
          <input id={`${id}-ref`} className={field} placeholder="Not found" value={item.reference ?? ""} onChange={(e) => onChange({ reference: e.target.value || null })} />
        </label>
      </div>

      <p className="text-sm tabular text-muted">
        {formatMoney(item.amount, item.currency)}
        {item.due_date ? ` · due ${formatDate(item.due_date)}` : " · no due date found"}
      </p>

      {item.missing_info.map((m) => (
        <p key={m} className="flex gap-2 rounded-xl bg-warn-bg px-3 py-2 text-sm text-warn">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> {m}
        </p>
      ))}

      {item.source_snippet && (
        <blockquote className="border-l-2 border-accent pl-3 text-sm text-muted">
          <span className="mb-0.5 block font-mono text-[0.68rem] uppercase tracking-wider">From your document</span>
          “{item.source_snippet}”
        </blockquote>
      )}
    </Card>
  );
}

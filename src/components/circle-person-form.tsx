"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export type PersonInput = { name: string; relation: string; phone: string | null };

/** Name, relation and an optional phone number for the FaceTime button. */
export function CirclePersonForm({
  submitLabel,
  defaultName = "",
  defaultRelation,
  relations,
  onSubmit,
}: {
  submitLabel: string;
  defaultName?: string;
  defaultRelation: string;
  relations: string[];
  onSubmit: (p: PersonInput) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = "rounded-xl border border-line bg-bg px-3 py-2.5";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name: String(f.get("name") || "").trim(),
        relation: String(f.get("relation") || defaultRelation),
        phone: String(f.get("phone") || "").trim() || null,
      });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1 text-sm font-semibold">
        Your name
        <input id="person-name" name="name" required maxLength={40} defaultValue={defaultName} autoComplete="given-name" className={field} />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        You are
        <select id="person-relation" name="relation" defaultValue={defaultRelation} className={field}>
          {relations.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Phone or Apple ID email <span className="font-normal text-muted">Optional, so family can FaceTime you</span>
        <input id="person-phone" name="phone" maxLength={30} autoComplete="tel" className={field} />
      </label>
      {error && <p className="text-sm text-bad">{error}</p>}
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden />} {submitLabel}
      </Button>
    </form>
  );
}

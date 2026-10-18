"use client";

import { useState } from "react";
import { RELATIONS } from "@/lib/circle/strings";
import { useCT } from "./useCT";

/** Name and relation, for starting or joining a Circle. */
export function PersonForm({
  submitLabel,
  defaultName = "",
  defaultRelation,
  onSubmit,
}: {
  submitLabel: string;
  defaultName?: string;
  defaultRelation: string;
  onSubmit: (p: { name: string; relation: string }) => Promise<void>;
}) {
  const t = useCT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name: String(f.get("name") || "").trim(), relation: String(f.get("relation") || defaultRelation) });
    } catch (err) {
      setError((err as Error).message || t("errGeneric"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <label className="flabel" style={{ display: "grid", gap: 6 }}>
        {t("yourName")}
        <input id="circle-name" name="name" className="input" required maxLength={40} defaultValue={defaultName} autoComplete="given-name" />
      </label>
      <label className="flabel" style={{ display: "grid", gap: 6 }}>
        {t("youAre")}
        <select id="circle-relation" name="relation" className="input" defaultValue={defaultRelation}>
          {RELATIONS.map((r) => <option key={r.value} value={r.value}>{t(r.key)}</option>)}
        </select>
      </label>
      {error && <p style={{ color: "var(--warn)", fontSize: 13 }}>{error}</p>}
      <button type="submit" className="btn dark" disabled={busy} style={{ justifySelf: "start" }}>{submitLabel}</button>
    </form>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PERSON } from "@/lib/demo-data";
import { circleApi, getMembership } from "@/lib/circle/client";
import { computeShares, toMinor, unassigned, type Receipt } from "@/lib/split";
import { minorMoney } from "@/lib/split-ui/strings";
import { Icon } from "../Icon";
import { useST } from "./useST";
import "./split.css";

export function SplitPage() {
  const t = useST();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<string[]>([PERSON.name]);
  const [payer, setPayer] = useState<string>(PERSON.name);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Start with the Circle's members when this phone is in a Circle.
  useEffect(() => {
    const m = getMembership();
    if (!m) return;
    circleApi
      .feed(m.code)
      .then((f) => {
        const mine = f.members.find((x) => x.id === m.memberId)?.name ?? PERSON.name;
        setPeople([mine, ...f.members.filter((x) => x.id !== m.memberId).map((x) => x.name)]);
        setPayer(mine);
      })
      .catch(() => {});
  }, []);

  async function scan(files: FileList | File[] | null) {
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
      setError((err as Error).message || t("errGeneric"));
    } finally {
      setScanning(false);
    }
  }

  /** A built-in receipt photo, still read by Gemini, for demos without a real receipt. */
  async function trySample() {
    setScanning(true);
    try {
      const blob = await (await fetch("/samples/receipt-dishoom.jpg")).blob();
      await scan([new File([blob], "sample-receipt.jpg", { type: "image/jpeg" })]);
    } catch {
      setError(t("errGeneric"));
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
    const n = newName.trim().slice(0, 30);
    if (n && !people.includes(n)) setPeople((p) => [...p, n]);
    setNewName("");
  }

  function removePerson(name: string) {
    const rest = people.filter((x) => x !== name);
    setPeople(rest);
    setReceipt((r) => r && { ...r, lines: r.lines.map((l) => ({ ...l, people: l.people.filter((p) => p !== name) })) });
    if (payer === name) setPayer(rest[0] ?? "");
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
      setError((err as Error).message || t("errGeneric"));
      setCreating(false);
    }
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{t("title")}</h1>
          <p>{t("sub")}</p>
        </div>
      </div>

      {!receipt && (
        <label htmlFor="receipt-input" className="split-drop">
          <Icon name={scanning ? "spark" : "receipt"} size={28} />
          <b>{scanning ? t("reading") : t("snap")}</b>
          <input id="receipt-input" type="file" accept="image/*" capture="environment" className="sr-only-x" disabled={scanning} onChange={(e) => scan(e.target.files)} />
        </label>
      )}
      {!receipt && (
        <button type="button" className="btn ghost sm" style={{ justifySelf: "start" }} disabled={scanning} onClick={trySample}>
          {t("trySample")}
        </button>
      )}
      {error && <div className="banner warn">{error}</div>}

      {receipt && (
        <div className="split-cols">
          <section style={{ display: "grid", gap: 12 }}>
            <div className="split-row">
              <h2 className="disp" style={{ fontSize: 26 }}>{receipt.merchant}</h2>
              <button type="button" className="btn ghost sm" onClick={() => setReceipt((r) => r && { ...r, lines: r.lines.map((l) => ({ ...l, people: [...people] })) })}>
                {t("evenly")}
              </button>
            </div>
            <p className="muted">{t("tapWho")}</p>
            {receipt.lines.map((l, i) => (
              <div key={i} className={l.people.length ? "card split-line" : "card split-line untagged"}>
                <div className="split-row">
                  <b>{l.name}</b>
                  <b className="mono">{minorMoney(l.amount_minor, receipt.currency)}</b>
                </div>
                <div className="split-chips">
                  {people.map((p) => (
                    <button key={p} type="button" className="split-chip" aria-pressed={l.people.includes(p)} onClick={() => toggle(i, p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {receipt.extras_minor > 0 && <p className="muted">{t("extras", { amount: minorMoney(receipt.extras_minor, receipt.currency) })}</p>}
          </section>

          <aside style={{ display: "grid", gap: 14 }}>
            <section className="card" style={{ display: "grid", gap: 12 }}>
              <span className="eyebrow">{t("who")}</span>
              <div className="split-chips">
                {people.map((p) => (
                  <span key={p} className="split-person">
                    {p}
                    {people.length > 1 && (
                      <button type="button" aria-label={t("remove", { name: p })} onClick={() => removePerson(p)}>
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <form onSubmit={addPerson} style={{ display: "flex", gap: 8 }}>
                <input id="split-new-person" className="input" aria-label={t("addPerson")} placeholder={t("addPerson")} value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={30} style={{ flex: 1, minWidth: 0 }} />
                <button type="submit" className="btn ghost" aria-label={t("add")}><Icon name="plus" size={18} /></button>
              </form>
              <label className="flabel">
                {t("payer")}
                <select id="split-payer" className="input" value={payer} onChange={(e) => setPayer(e.target.value)}>
                  {people.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
            </section>

            <section className="card" style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow">{t("eachPays")}</span>
              {shares.map((s) => (
                <div key={s.person} className="split-row">
                  <span>{s.person}{s.person === payer && <span className="muted"> · {t("paidBill")}</span>}</span>
                  <b className="mono">{minorMoney(s.amount_minor, receipt.currency)}</b>
                </div>
              ))}
            </section>

            <div className="split-sticky">
              <button type="button" className="btn dark" disabled={creating || missing > 0 || people.length < 2} onClick={create}>
                {people.length < 2 ? t("needPeople") : missing > 0 ? t("needTags", { n: missing }) : t("create")}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

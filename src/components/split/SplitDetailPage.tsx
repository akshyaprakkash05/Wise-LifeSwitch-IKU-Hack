"use client";

import { useCallback, useEffect, useState } from "react";
import { shareToCircle } from "@/lib/circle/client";
import { minorMoney } from "@/lib/split-ui/strings";
import type { SplitView } from "@/lib/server/split";
import { Icon } from "../Icon";
import { ApplePayButton } from "./ApplePayButton";
import { useST } from "./useST";
import "./split.css";

export function SplitDetailPage({ id, isNew }: { id: string; isNew: boolean }) {
  const t = useST();
  const [split, setSplit] = useState<SplitView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [walletMissing, setWalletMissing] = useState<string | null>(null);
  const key = `lifeswitch:split:${id}`;

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
      setMe(localStorage.getItem(key));
    } catch {}
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 3000);
    return () => clearInterval(timer);
  }, [key, load]);

  function pick(person: string | null) {
    setMe(person);
    try {
      if (person) localStorage.setItem(key, person);
      else localStorage.removeItem(key);
    } catch {}
  }

  if (error && !split) return <div className="banner warn">{error}</div>;
  if (!split) return <p className="muted">{t("loading")}</p>;

  const s = split;
  const mine = s.shares.find((x) => x.person === me);
  const paidCount = s.shares.filter((x) => x.status === "paid").length;
  const money = (minor: number) => minorMoney(minor, s.currency);

  async function post(path: string) {
    const res = await fetch(`/api/split/${id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareId: mine!.id }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    return json;
  }

  async function shareLink() {
    const url = `${location.origin}/split/${id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${t("title")}: ${s.merchant}`, text: t("linkText"), url });
      else await navigator.clipboard.writeText(url);
    } catch {}
  }

  return (
    <>
      <div className="phead">
        <div>
          <span className="eyebrow">{t("paidBy", { name: s.payer })}</span>
          <h1 className="disp">{s.merchant}</h1>
          <p>{t("paidCount", { paid: paidCount, total: s.shares.length })}</p>
        </div>
        <button type="button" className="btn saffron" onClick={shareLink}><Icon name="users" size={18} /> {t("sendLink")}</button>
      </div>

      {isNew && me === s.payer && <div className="banner ok">{t("newHint")}</div>}

      <div className="split-cols">
        <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
          {!mine && (
            <section className="card" style={{ display: "grid", gap: 12 }}>
              <h2 className="disp" style={{ fontSize: 24 }}>{t("whichOne")}</h2>
              <div className="split-chips">
                {s.shares.map((x) => (
                  <button key={x.id} type="button" className="btn ghost sm" onClick={() => pick(x.person)}>{x.person}</button>
                ))}
              </div>
            </section>
          )}

          {mine && (
            <section className="card" style={{ display: "grid", gap: 12, borderColor: mine.status === "paid" ? "var(--ok)" : "var(--forest)" }}>
              <div className="split-row">
                <span className="eyebrow">{t("yourShare", { name: mine.person })}</span>
                <button type="button" className="x-btn" style={{ width: "auto", padding: "0 8px", fontSize: 13 }} onClick={() => pick(null)}>{t("notYou")}</button>
              </div>
              <p className="split-big">{money(mine.amount_minor)}</p>
              <ul className="muted" style={{ fontSize: 14, listStyle: "disc", paddingLeft: 20 }}>
                {mine.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
              {mine.status === "paid" ? (
                <div className="banner ok"><Icon name="check" size={18} /> {mine.person === s.payer ? t("youPaidBill") : mine.method ? t("paidWith", { method: mine.method }) : t("paid")}</div>
              ) : (
                <>
                  <ApplePayButton
                    amountMinor={mine.amount_minor}
                    currency={s.currency}
                    label={`${s.merchant}`}
                    createPayment={async () => (await post("pay")).clientSecret as string}
                    onPaid={async () => {
                      await post("confirm");
                      shareToCircle("payment", `paid their share at ${s.merchant} (${money(mine.amount_minor)})`);
                      await load();
                    }}
                    onUnavailable={(r) => setWalletMissing(r === "no_key" ? t("noStripe") : t("noWallet"))}
                  />
                  {walletMissing && <p style={{ color: "var(--warn)", fontSize: 13 }}>{walletMissing}</p>}
                  <button type="button" className="btn ghost sm" style={{ justifySelf: "start" }} onClick={async () => { await post("manual"); await load(); }}>
                    {t("anotherWay", { name: s.payer })}
                  </button>
                  <span className="eyebrow">{t("testMode")}</span>
                </>
              )}
            </section>
          )}
        </div>

        <section className="card" style={{ display: "grid", gap: 10, alignContent: "start" }} aria-live="polite">
          <span className="eyebrow">{t("everyone")}</span>
          {s.shares.map((x) => (
            <div key={x.id} className="split-row">
              <b>{x.person}</b>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="mono">{money(x.amount_minor)}</span>
                <span className={x.status === "paid" ? "pill p-ok" : "pill p-idle"}>{x.status === "paid" ? t("paid") : t("waiting")}</span>
              </span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

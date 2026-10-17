"use client";

import { useMemo, useState } from "react";
import { format } from "@/lib/money";
import { needsReference, referenceFor, statusOf } from "@/lib/roadmap";
import { shortDate } from "@/lib/tabs/dates";
import type { RoadmapItem } from "@/lib/types";
import { prepareTransfer, sendCheckedTransfer } from "@/services/payments";
import { useApp } from "@/state/app-state";
import { Icon, type IconName } from "../Icon";
import { ScamShield } from "./ScamShield";
import "./tabs.css";
import { useT } from "./useT";

type Stage = "check" | "confirm" | "sent";

function iconFor(item: RoadmapItem, paid: boolean): IconName {
  if (paid) return "check";
  return item.category === "Tuition" ? "cap" : "home";
}

export function PaymentsPage() {
  const t = useT();
  const { items, state, dispatch, money } = useApp();
  const sorted = useMemo(() => [...items].sort((a, b) => a.due.localeCompare(b.due)), [items]);
  const pending = sorted.filter((i) => !state.paid[i.id]);
  const sent = sorted.filter((i) => state.paid[i.id]);
  const selected = items.find((i) => i.id === state.selectedId) ?? pending[0] ?? sent[0];

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{t("pay.title")}</h1>
          <p>{t("pay.sub")}</p>
        </div>
      </div>

      <div className="tab-cols pay">
        <section className="card" style={{ padding: 16 }}>
          <span className="eyebrow" style={{ display: "block", padding: "4px 6px 10px" }}>{t("pay.prepared")} · {pending.length}</span>
          {pending.length === 0 && <p className="muted" style={{ padding: 6 }}>{t("pay.empty")}</p>}
          <ul style={{ display: "grid", gap: 2 }}>
            {pending.map((i) => <Row key={i.id} item={i} active={selected?.id === i.id} />)}
          </ul>
          {sent.length > 0 && (
            <>
              <span className="eyebrow" style={{ display: "block", padding: "18px 6px 10px" }}>{t("pay.sent")} · {sent.length}</span>
              <ul style={{ display: "grid", gap: 2 }}>
                {sent.map((i) => <Row key={i.id} item={i} active={selected?.id === i.id} />)}
              </ul>
            </>
          )}
        </section>

        <section className="card" style={{ display: "grid", gap: 16 }}>
          {selected ? <Detail key={selected.id} item={selected} /> : <p className="muted">{t("pay.pick")}</p>}
        </section>
      </div>
    </>
  );

  function Row({ item, active }: { item: RoadmapItem; active: boolean }) {
    const paid = !!state.paid[item.id];
    const missing = !paid && needsReference(item, state.references);
    const pill = paid
      ? { cls: "p-ok", label: t("pay.statusSent") }
      : missing
        ? { cls: "p-fam", label: t("pay.statusNeedsRef") }
        : { cls: active ? "p-ready" : "p-idle", label: t("pay.statusPrepared") };
    return (
      <li>
        <button type="button" className="pay-row" aria-pressed={active} onClick={() => dispatch({ type: "select", id: item.id })}>
          <span className={`icon-tile${paid ? " soft" : ""}`}><Icon name={iconFor(item, paid)} size={18} /></span>
          <span className="text">
            <b>{item.title}</b>
            <small>{item.payeeShort} · {t("pay.due", { date: shortDate(item.due) })}</small>
          </span>
          <span className="right">
            <b className="num">{money(item.amountGbp)}</b>
            <span className={`pill ${pill.cls}`}>{pill.label}</span>
          </span>
        </button>
      </li>
    );
  }
}

function Detail({ item }: { item: RoadmapItem }) {
  const t = useT();
  const { state, dispatch, notify, money } = useApp();
  const paid = !!state.paid[item.id];
  const [stage, setStage] = useState<Stage>(paid ? "sent" : "check");
  const [refDraft, setRefDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const missingRef = needsReference(item, state.references);
  const reference = missingRef ? refDraft.trim().toUpperCase() : referenceFor(item, state.references);
  const refOk = !missingRef || refDraft.trim().length >= 4;
  const quote = useMemo(() => prepareTransfer(item, state.currency, state.fx.rate), [item, state.currency, state.fx.rate]);
  const stepIndex = stage === "check" ? 0 : stage === "confirm" ? 1 : 2;

  async function send(confirmRisk: boolean) {
    setSending(true);
    setError("");
    try {
      await sendCheckedTransfer(item, reference, confirmRisk);
      dispatch({ type: "markPaid", id: item.id, reference: missingRef ? reference : "" });
      notify(`${item.title} sent with Wise (demo). Your Circle can see it.`);
      setStage("sent");
    } catch (e) {
      setError(t("pay.error", { msg: e instanceof Error ? e.message : "" }));
    } finally {
      setSending(false);
    }
  }

  const steps = (
    <ol className="steps" aria-label="Transfer steps">
      {[t("pay.step1"), t("pay.step2"), t("pay.step3")].map((label, n) => (
        <li key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {n > 0 && <span className="step-line" />}
          <span className={`step ${n < stepIndex || (n === 2 && stage === "sent") ? "done" : n === stepIndex ? "on" : ""}`}>
            <i>{n < stepIndex || stage === "sent" ? "✓" : n + 1}</i>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );

  const header = (
    <div>
      <span className="eyebrow">{item.title}</span>
      <h2 className="disp" style={{ fontSize: 32, marginTop: 4 }}>{item.payee}</h2>
      <span className="mono muted" style={{ fontSize: 13 }}>
        {t("pay.ukAccount", { last4: item.account.replace(/[^0-9A-Z]/gi, "") })} · {t("pay.due", { date: item.dueLabel })}
      </span>
    </div>
  );

  if (stage === "sent") {
    return (
      <>
        {steps}
        <div className="receipt" aria-live="polite">
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--lime)", color: "var(--forest)", display: "grid", placeItems: "center" }}>
            <Icon name="check" size={28} stroke={3} />
          </span>
          <h2 className="disp" style={{ fontSize: 32, color: "#fff" }}>{t("pay.sentTitle", { payee: item.payee })}</h2>
          <p className="mono" style={{ color: "var(--rail-text)" }}>
            {t("pay.sentSub", { amount: format(item.amountGbp, "GBP", 2), ref: referenceFor(item, state.references) })}
          </p>
          <ul style={{ display: "grid", gap: 8 }}>
            {[t("pay.tlPrepared"), t("pay.tlChecked"), t("pay.tlSent")].map((label) => (
              <li key={label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--lime)", color: "var(--forest)", display: "grid", placeItems: "center" }}>
                  <Icon name="check" size={13} stroke={3} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  if (stage === "confirm") {
    return (
      <>
        {steps}
        {header}
        <dl className="facts">
          <dt>{t("pay.youSend")}</dt><dd className="num">{format(quote.sourceAmount, quote.sourceCurrency, 2)}</dd>
          <dt>{t("pay.gets", { payee: item.payeeShort })}</dt><dd className="num">{format(quote.targetAmount, "GBP", 2)}</dd>
          <dt>{t("pay.reference")}</dt><dd className="mono">{reference}</dd>
        </dl>
        <ScamShield
          item={{ payee: item.payee, bank: item.bank, source_text: item.sourceText ?? null, source_snippet: item.sourceSnippet, amount: item.amountGbp, currency: "GBP" }}
          busy={sending}
          proceedLabel={sending ? t("pay.sending") : t("pay.confirmSend", { amount: money(item.amountGbp) })}
          onProceed={send}
        />
        {error && <div className="banner warn" role="alert"><Icon name="alert" size={18} /><span className="grow">{error}</span></div>}
        <button type="button" className="btn ghost sm" style={{ justifySelf: "start" }} disabled={sending} onClick={() => setStage("check")}>
          {t("pay.back")}
        </button>
      </>
    );
  }

  return (
    <>
      {steps}
      {header}
      <div className="money-box">
        <div className="mrow">
          <div>
            <span className="muted" style={{ fontSize: 13 }}>{t("pay.youSend")}</span>
            <br />
            <b className="amount num">{format(quote.sourceAmount, quote.sourceCurrency, 2)}</b>
          </div>
          <span className="ccy">
            <span className="flag" style={{ background: quote.sourceCurrency === "USD" ? "#A0E1E1" : "#9FE870" }}>{quote.sourceCurrency === "USD" ? "US" : "GB"}</span>
            {quote.sourceCurrency}
          </span>
        </div>
        <div className="mrow meta">
          <span><span className="muted">{t("pay.fee")}</span><b className="num">{format(quote.fee, quote.sourceCurrency, 2)}</b></span>
          <span>
            <span className="muted">{state.fx.source === "live" ? t("pay.rate").replace(/\s*\(.*\)$/, "") : t("pay.rate")}</span>
            <b className="mono num">{quote.rate ? `1 GBP = ${quote.rate.toFixed(4)} USD` : t("pay.sameCurrency")}</b>
          </span>
          <span><span className="muted">{t("pay.arrive")}</span><b>{t("pay.arriveFast")}</b></span>
        </div>
        <div className="mrow">
          <div>
            <span className="muted" style={{ fontSize: 13 }}>{t("pay.gets", { payee: item.payeeShort })}</span>
            <br />
            <b className="amount num">{format(quote.targetAmount, "GBP", 2)}</b>
          </div>
          <span className="ccy"><span className="flag" style={{ background: "#9FE870" }}>GB</span>GBP</span>
        </div>
      </div>

      {item.sourceSnippet && (
        <details className="src">
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>{t("pay.fromDoc")}</summary>
          <p>“{item.sourceSnippet}”</p>
        </details>
      )}

      {missingRef ? (
        <label className="flabel" htmlFor={`ref-${item.id}`}>
          <span>{t("pay.reference")} · <span style={{ color: "var(--warn)" }}>{t("pay.statusNeedsRef")}</span></span>
          <input id={`ref-${item.id}`} className="input mono" placeholder={t("pay.refPlaceholder")} value={refDraft} autoComplete="off" onChange={(e) => setRefDraft(e.target.value)} />
          <span className="muted" style={{ fontWeight: 400 }}>{t("pay.addRef", { payee: item.payeeShort })}</span>
        </label>
      ) : (
        <dl className="facts"><dt>{t("pay.reference")}</dt><dd className="mono">{reference}</dd></dl>
      )}

      <button type="button" className="btn dark" disabled={!refOk} onClick={() => setStage("confirm")}>
        {t("pay.continue")}
        <Icon name="arrow" size={18} stroke={2.4} />
      </button>
    </>
  );
}

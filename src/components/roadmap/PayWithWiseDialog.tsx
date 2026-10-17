"use client";

import { useCallback, useMemo, useState } from "react";
import { DOCS } from "@/lib/demo-data";
import { format } from "@/lib/money";
import { needsReference, referenceFor } from "@/lib/roadmap";
import type { RoadmapItem } from "@/lib/types";
import { prepareTransfer, sendTransfer, type TransferReceipt } from "@/services/payments";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import { Dialog } from "./Dialog";

type Stage = "check" | "confirm" | "sending" | "sent";
const STEPS = ["Check", "Confirm", "Sent"] as const;

export function PayWithWiseDialog() {
  const { state, items, dispatch } = useApp();
  const item = items.find((i) => i.id === state.payItemId);
  const close = useCallback(() => dispatch({ type: "closePay" }), [dispatch]);
  if (!item) return null;
  // Keyed by item so every payment starts fresh at the Check step.
  return <PayFlow key={item.id} item={item} onClose={close} />;
}

function PayFlow({ item, onClose }: { item: RoadmapItem; onClose: () => void }) {
  const { state, dispatch, money, notify } = useApp();
  const [stage, setStage] = useState<Stage>(state.paid[item.id] ? "sent" : "check");
  const [refDraft, setRefDraft] = useState("");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);

  const quote = useMemo(() => prepareTransfer(item, state.currency, state.fx.rate), [item, state.currency, state.fx.rate]);
  const missingRef = needsReference(item, state.references);
  const reference = missingRef ? refDraft.trim().toUpperCase() : referenceFor(item, state.references);
  const refOk = !missingRef || refDraft.trim().length >= 4;
  const stepIndex = stage === "check" ? 0 : stage === "sent" ? 2 : 1;

  async function send() {
    setStage("sending");
    setError("");
    try {
      const result = await sendTransfer(quote, reference);
      setReceipt(result);
      dispatch({ type: "markPaid", id: item.id, reference: missingRef ? reference : "" });
      setStage("sent");
      notify(`${item.title} sent with Wise (demo). Your Circle can see it.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The transfer couldn’t be sent. Nothing left your account.");
      setStage("confirm");
    }
  }

  return (
    <Dialog labelledBy="pay-title" onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <ol className="steps" aria-label="Transfer steps">
          {STEPS.map((label, n) => (
            <li key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {n > 0 && <span className="step-line" />}
              <span className={`step ${n < stepIndex ? "done" : n === stepIndex ? "on" : ""}`}>
                <i>{n + 1}</i>
                {label}
              </span>
            </li>
          ))}
        </ol>
        <button type="button" className="x-btn" onClick={onClose} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      {stage === "sent" ? (
        <div className="receipt" aria-live="polite">
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--lime)", color: "var(--forest)", display: "grid", placeItems: "center" }}>
            <Icon name="check" size={28} stroke={3} />
          </span>
          <h2 id="pay-title" className="disp" style={{ fontSize: 32, color: "#fff" }}>
            {money(item.amountGbp)} on its way
          </h2>
          <p style={{ color: "var(--rail-text)" }}>
            {item.title} to {item.payee}. Demo transfer: no real money moved.
          </p>
          <dl className="facts" style={{ color: "#EAF3E2" }}>
            <dt style={{ color: "var(--rail-dim)" }}>Reference</dt>
            <dd className="mono">{receipt?.reference ?? referenceFor(item, state.references)}</dd>
            <dt style={{ color: "var(--rail-dim)" }}>Recipient gets</dt>
            <dd>{format(item.amountGbp, "GBP")}</dd>
            <dt style={{ color: "var(--rail-dim)" }}>Circle</dt>
            <dd>Your family sees “{item.title} paid”, never the amount</dd>
          </dl>
          <button type="button" className="btn" style={{ justifySelf: "start" }} onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <>
          <div>
            <span className="eyebrow">{item.title}</span>
            <h2 id="pay-title" className="disp" style={{ fontSize: 28, marginTop: 4 }}>{item.payee}</h2>
            <span className="mono muted" style={{ fontSize: 13 }}>UK account {item.account} · due {item.dueLabel}</span>
          </div>

          <div className="money-box">
            <div className="mrow">
              <div>
                <span className="muted" style={{ fontSize: 13 }}>You send</span>
                <br />
                <b className="amount num">{format(quote.sourceAmount, quote.sourceCurrency, 2)}</b>
              </div>
              <span className="ccy">
                <span className="flag" style={{ background: quote.sourceCurrency === "USD" ? "#A0E1E1" : "#9FE870" }}>
                  {quote.sourceCurrency === "USD" ? "US" : "GB"}
                </span>
                {quote.sourceCurrency}
              </span>
            </div>
            <div className="mrow meta">
              <span><span className="muted">Fee (sample)</span><b className="num">{format(quote.fee, quote.sourceCurrency, 2)}</b></span>
              <span>
                <span className="muted">Rate{state.fx.source === "live" ? "" : " (sample)"}</span>
                <b className="mono num">{quote.rate ? `1 GBP = ${quote.rate.toFixed(4)} USD` : "Same currency"}</b>
              </span>
              <span><span className="muted">Should arrive</span><b>In seconds (sample)</b></span>
            </div>
            <div className="mrow">
              <div>
                <span className="muted" style={{ fontSize: 13 }}>{item.payeeShort} gets</span>
                <br />
                <b className="amount num">{format(quote.targetAmount, "GBP", 2)}</b>
              </div>
              <span className="ccy"><span className="flag" style={{ background: "#9FE870" }}>GB</span>GBP</span>
            </div>
          </div>

          {missingRef ? (
            <label className="flabel" htmlFor="ref-input">
              <span>Payment reference <span style={{ color: "var(--warn)" }}>required</span></span>
              <input
                id="ref-input"
                className="input mono"
                placeholder="Ask the landlord, e.g. NSL-14B-TARA"
                value={refDraft}
                onChange={(e) => setRefDraft(e.target.value)}
                disabled={stage !== "check"}
                autoComplete="off"
              />
              <span className="muted" style={{ fontWeight: 400 }}>
                We couldn&apos;t find one in your {DOCS[item.doc].name.toLowerCase()}. Without it the payment may be delayed.
              </span>
            </label>
          ) : (
            <dl className="facts"><dt>Reference</dt><dd className="mono">{reference}</dd></dl>
          )}

          {error && <div className="banner warn" role="alert"><Icon name="alert" size={18} />{error}</div>}

          {stage === "check" ? (
            <>
              <button type="button" className="btn dark" disabled={!refOk} onClick={() => setStage("confirm")}>
                Continue
                <Icon name="arrow" size={18} stroke={2.4} />
              </button>
              {!refOk && <span className="muted" style={{ fontSize: 13 }}>Add the reference to continue.</span>}
            </>
          ) : (
            <>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  disabled={stage === "sending"}
                  style={{ width: 22, height: 22, accentColor: "#163300", marginTop: 1 }}
                />
                <span>I&apos;ve checked the payee, amount and reference match my {DOCS[item.doc].name.toLowerCase()}.</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn" style={{ flex: "1 1 200px" }} disabled={!checked || stage === "sending"} onClick={send}>
                  {stage === "sending" ? <span className="spin" aria-hidden="true" /> : <Icon name="lock" size={18} />}
                  {stage === "sending" ? "Sending…" : `Confirm and send ${money(item.amountGbp)}`}
                </button>
                <button type="button" className="btn ghost" disabled={stage === "sending"} onClick={() => setStage("check")}>
                  Back
                </button>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>Nothing is sent until you confirm. Demo transfer only.</span>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}

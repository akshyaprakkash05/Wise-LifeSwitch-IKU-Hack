"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "@/lib/money";
import { needsReference, referenceFor } from "@/lib/roadmap";
import type { RoadmapItem } from "@/lib/types";
import { prepareTransfer, sendTransfer, type TransferReceipt } from "@/services/payments";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import { Dialog } from "./Dialog";

type Stage = "check" | "confirm" | "sending" | "sent";
const STEPS = ["step_check", "step_confirm", "step_sent"] as const;

export function PayWithWiseDialog() {
  const { state, items, dispatch } = useApp();
  const item = items.find((i) => i.id === state.payItemId);
  const close = useCallback(() => dispatch({ type: "closePay" }), [dispatch]);
  if (!item) return null;
  // Keyed by item so every payment starts fresh at the Check step.
  return <PayFlow key={item.id} item={item} onClose={close} />;
}

function PayFlow({ item, onClose }: { item: RoadmapItem; onClose: () => void }) {
  const { state, dispatch, money, notify, t, itemText, fmt } = useApp();
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
  const title = itemText(item, "title");
  const doc = t(`doc_${item.doc}`);

  async function send() {
    setStage("sending");
    setError("");
    try {
      const result = await sendTransfer(quote, reference);
      setReceipt(result);
      dispatch({ type: "markPaid", id: item.id, reference: missingRef ? reference : "" });
      setStage("sent");
      notify(t("sentToast", { title }));
    } catch {
      setError(t("sendFailed"));
      setStage("confirm");
    }
  }

  return (
    <Dialog labelledBy="pay-title" onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <ol className="steps" aria-label={t("transferSteps")}>
          {STEPS.map((label, n) => (
            <li key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {n > 0 && <span className="step-line" />}
              <span className={`step ${n < stepIndex ? "done" : n === stepIndex ? "on" : ""}`}>
                <i>{n + 1}</i>
                {t(label)}
              </span>
            </li>
          ))}
        </ol>
        <button type="button" className="x-btn" onClick={onClose} aria-label={t("close")}>
          <Icon name="x" size={18} />
        </button>
      </div>

      {stage === "sent" ? (
        <div className="receipt" aria-live="polite">
          <span style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--lime)", color: "var(--forest)", display: "grid", placeItems: "center" }}>
            <Icon name="check" size={28} stroke={3} />
          </span>
          <h2 id="pay-title" className="disp" style={{ fontSize: 32, color: "#fff" }}>
            {t("onItsWay", { amount: money(item.amountGbp) })}
          </h2>
          <p style={{ color: "var(--rail-text)" }}>
            {t("sentTo", { title, payee: item.payee })}
          </p>
          <dl className="facts" style={{ color: "#EAF3E2" }}>
            <dt style={{ color: "var(--rail-dim)" }}>{t("reference")}</dt>
            <dd className="mono">{receipt?.reference ?? referenceFor(item, state.references)}</dd>
            <dt style={{ color: "var(--rail-dim)" }}>{t("recipientGets")}</dt>
            <dd>{format(item.amountGbp, "GBP")}</dd>
            <dt style={{ color: "var(--rail-dim)" }}>{t("circleLabel")}</dt>
            <dd>{t("circleSees", { title })}</dd>
          </dl>
          <button type="button" className="btn" style={{ justifySelf: "start" }} onClick={onClose}>
            {t("done")}
          </button>
        </div>
      ) : (
        <>
          <div>
            <span className="eyebrow">{title}</span>
            <h2 id="pay-title" className="disp" style={{ fontSize: 28, marginTop: 4 }}>{item.payee}</h2>
            <span className="mono muted" style={{ fontSize: 13 }}>{t("ukAccount", { acct: item.account, date: fmt.longDate(item.due) })}</span>
          </div>

          <div className="money-box">
            <div className="mrow">
              <div>
                <span className="muted" style={{ fontSize: 13 }}>{t("youSend")}</span>
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
              <span><span className="muted">{t("feeSample")}</span><b className="num">{format(quote.fee, quote.sourceCurrency, 2)}</b></span>
              <span>
                <span className="muted">{t(state.fx.source === "live" ? "rate" : "rateSample")}</span>
                <b className="mono num">{quote.rate ? `1 GBP = ${quote.rate.toFixed(4)} USD` : t("sameCurrency")}</b>
              </span>
              <span><span className="muted">{t("arrive")}</span><b>{t("inSeconds")}</b></span>
            </div>
            <div className="mrow">
              <div>
                <span className="muted" style={{ fontSize: 13 }}>{t("gets", { payee: item.payeeShort })}</span>
                <br />
                <b className="amount num">{format(quote.targetAmount, "GBP", 2)}</b>
              </div>
              <span className="ccy"><span className="flag" style={{ background: "#9FE870" }}>GB</span>GBP</span>
            </div>
          </div>

          {missingRef ? (
            <label className="flabel" htmlFor="ref-input">
              <span>{t("refLabel")} <span style={{ color: "var(--warn)" }}>{t("required")}</span></span>
              <input
                id="ref-input"
                className="input mono"
                placeholder={t("refPlaceholder")}
                value={refDraft}
                onChange={(e) => setRefDraft(e.target.value)}
                disabled={stage !== "check"}
                autoComplete="off"
              />
              <span className="muted" style={{ fontWeight: 400 }}>
                {t("refHelp", { doc })}
              </span>
            </label>
          ) : (
            <dl className="facts"><dt>{t("reference")}</dt><dd className="mono">{reference}</dd></dl>
          )}

          {error && <div className="banner warn" role="alert"><Icon name="alert" size={18} />{error}</div>}

          {stage === "check" ? (
            <>
              <button type="button" className="btn dark" disabled={!refOk} onClick={() => setStage("confirm")}>
                {t("continue")}
                <Icon name="arrow" size={18} stroke={2.4} />
              </button>
              {!refOk && <span className="muted" style={{ fontSize: 13 }}>{t("addRefToContinue")}</span>}
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
                <span>{t("checkedBox", { doc })}</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn" style={{ flex: "1 1 200px" }} disabled={!checked || stage === "sending"} onClick={send}>
                  {stage === "sending" ? <span className="spin" aria-hidden="true" /> : <Icon name="lock" size={18} />}
                  {stage === "sending" ? t("sending") : t("confirmSend", { amount: money(item.amountGbp) })}
                </button>
                <button type="button" className="btn ghost" disabled={stage === "sending"} onClick={() => setStage("check")}>
                  {t("back")}
                </button>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>{t("nothingSent")}</span>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}

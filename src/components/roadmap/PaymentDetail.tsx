"use client";

import { DOCS } from "@/lib/demo-data";
import { explain } from "@/lib/i18n";
import { needsReference, referenceFor, statusOf } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

export function PaymentDetail() {
  const { t, items, state, dispatch, money, moneyAlt } = useApp();
  const item = items.find((i) => i.id === state.selectedId) ?? items[0];
  const paid = !!state.paid[item.id];
  const status = statusOf(item, paid, state.references);
  const missingRef = needsReference(item, state.references) && !paid;
  const reference = referenceFor(item, state.references);
  const openTerm = state.openTerm && item.terms.includes(state.openTerm) ? state.openTerm : null;
  const explanation = openTerm ? explain(state.lang, openTerm) : null;
  const docName = DOCS[item.doc].name;

  return (
    <aside className="card" style={{ flex: "1 1 340px", display: "grid", gap: 16 }} aria-label="Payment details">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className="pill p-idle"><Icon name="doc" size={14} stroke={2.2} />{docName}</span>
        <span className={`pill ${status.pill}`}>{status.label}</span>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <h3 className="disp" style={{ fontSize: 26 }}>{item.title}</h3>
        <span className="big num" style={{ fontSize: 48 }}>{money(item.amountGbp)}</span>
        <span className="mono num muted" style={{ fontSize: 13 }}>≈ {moneyAlt(item.amountGbp)}</span>
      </div>

      <dl className="facts">
        <dt>Due</dt><dd>{item.dueLabel}</dd>
        <dt>Pay to</dt><dd>{item.payee}</dd>
        <dt>Reference</dt>
        <dd className="mono" style={missingRef ? { color: "var(--warn)" } : undefined}>{reference || "Not found"}</dd>
        <dt>Repeats</dt><dd>{item.repeat}</dd>
      </dl>

      <div className="src">
        <span className="eyebrow" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Icon name="spark" size={14} />Found by AI in your {docName.toLowerCase()}
        </span>
        <p>“{item.sourceSnippet}”</p>
      </div>

      {missingRef && (
        <div className="banner warn" style={{ fontSize: 14 }}>
          <Icon name="alert" size={20} />
          <span className="grow">
            <b>No payment reference found.</b> Ask {item.payeeShort} which reference to use. You can add it when you pay.
          </span>
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>{t("newWords")}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {item.terms.map((term) => (
            <button
              key={term}
              type="button"
              className="term"
              aria-expanded={openTerm === term}
              onClick={() => dispatch({ type: "toggleTerm", term })}
            >
              {term}
            </button>
          ))}
        </div>
        {explanation && (
          <p className="gloss">
            {explanation.text}
            {explanation.fallback && <span style={{ opacity: 0.7 }}> (shown in English)</span>}
          </p>
        )}
      </div>

      {paid ? (
        <div className="banner ok">
          <Icon name="check" size={20} stroke={2.6} />
          <span className="grow">Paid with Wise. Your Circle can see it.</span>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn" style={{ flex: "1 1 180px" }} onClick={() => dispatch({ type: "openPay", id: item.id })}>
            {t("payWise")}
            <Icon name="arrow" size={18} stroke={2.4} />
          </button>
        </div>
      )}
    </aside>
  );
}

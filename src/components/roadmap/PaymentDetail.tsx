"use client";

import { explain } from "@/lib/i18n";
import { needsReference, referenceFor, statusOf } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

export function PaymentDetail() {
  const { t, items, state, dispatch, money, moneyAlt, itemText, fmt } = useApp();
  const item = items.find((i) => i.id === state.selectedId) ?? items[0];
  const paid = !!state.paid[item.id];
  const status = statusOf(item, paid, state.references);
  const missingRef = needsReference(item, state.references) && !paid;
  const reference = referenceFor(item, state.references);
  const openTerm = state.openTerm && item.terms.includes(state.openTerm) ? state.openTerm : null;
  const explanation = openTerm ? explain(state.lang, openTerm) : null;
  const dueDate = fmt.longDate(item.due);

  return (
    <aside className="card" style={{ flex: "1 1 340px", display: "grid", gap: 16 }} aria-label={t("paymentDetails")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className="pill p-idle"><Icon name="doc" size={14} stroke={2.2} />{t(`docName_${item.doc}`)}</span>
        <span className={`pill ${status.pill}`}>{t(status.label)}</span>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <h3 className="disp" style={{ fontSize: 26 }}>{itemText(item, "title")}</h3>
        <span className="big num" style={{ fontSize: 48 }}>{money(item.amountGbp)}</span>
        <span className="mono num muted" style={{ fontSize: 13 }}>≈ {moneyAlt(item.amountGbp)}</span>
      </div>

      <dl className="facts">
        <dt>{t("due")}</dt><dd>{item.recurring ? t("thenMonthly", { date: dueDate }) : dueDate}</dd>
        <dt>{t("payTo")}</dt><dd>{item.payee}</dd>
        <dt>{t("reference")}</dt>
        <dd className="mono" style={missingRef ? { color: "var(--warn)" } : undefined}>{reference || t("notFound")}</dd>
        <dt>{t("repeats")}</dt><dd>{item.recurring ? t("monthly1st") : t("oneOff")}</dd>
      </dl>

      <div className="src">
        <span className="eyebrow" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Icon name="spark" size={14} />{t("foundIn", { doc: t(`doc_${item.doc}`) })}
        </span>
        <p>“{item.sourceSnippet}”</p>
      </div>

      {missingRef && (
        <div className="banner warn" style={{ fontSize: 14 }}>
          <Icon name="alert" size={20} />
          <span className="grow">
            <b>{t("noRefTitle")}</b> {t("noRefBody", { payee: item.payeeShort })}
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
            {explanation.fallback && <span style={{ opacity: 0.7 }}> {t("shownInEnglish")}</span>}
          </p>
        )}
      </div>

      {paid ? (
        <div className="banner ok">
          <Icon name="check" size={20} stroke={2.6} />
          <span className="grow">{t("paidCircle")}</span>
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

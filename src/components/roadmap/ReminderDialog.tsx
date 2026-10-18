"use client";

import { useCallback } from "react";
import { referenceFor } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import { Dialog } from "./Dialog";

/** The in-app reminder that pops up three days before a payment is due. */
export function ReminderDialog() {
  const { state, items, dispatch, money, moneyAlt, t, notify, fmt } = useApp();
  const close = useCallback(() => dispatch({ type: "setReminder", open: false }), [dispatch]);
  const rent = items.find((i) => i.id === "rent1");
  if (!state.reminderOpen || !rent) return null;

  return (
    <Dialog labelledBy="reminder-title" onClose={close}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="pill p-fam"><Icon name="bell" size={14} />{t("remIn3")}</span>
        <button type="button" className="x-btn" onClick={close} aria-label={t("close")}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <h2 id="reminder-title" className="disp" style={{ fontSize: 34 }}>{t("rentDueOn", { date: fmt.longDate(rent.due) })}</h2>
      <div>
        <span className="big num" style={{ fontSize: 52 }}>{money(rent.amountGbp)}</span>{" "}
        <span className="mono muted num">≈ {moneyAlt(rent.amountGbp)}</span>
      </div>
      <p className="muted">
        {t("remBody", { payee: rent.payee, ref: referenceFor(rent, state.references) })}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {state.paid[rent.id] ? (
          <span className="banner ok" style={{ flex: 1 }}>{t("alreadyPaid")}</span>
        ) : (
          <button type="button" className="btn dark" style={{ flex: "1 1 180px" }} onClick={() => dispatch({ type: "openPay", id: rent.id })}>
            {t("payWise")}
            <Icon name="arrow" size={18} stroke={2.4} />
          </button>
        )}
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            close();
            notify(t("snoozed"));
          }}
        >
          {t("remindTomorrow")}
        </button>
      </div>
    </Dialog>
  );
}

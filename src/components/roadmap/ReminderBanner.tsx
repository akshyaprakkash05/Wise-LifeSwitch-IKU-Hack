"use client";

import { daysUntil, needsReference } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

export function ReminderBanner() {
  const { items, state, dispatch, t, itemText } = useApp();
  const rentDeposit = items.find((i) => i.id === "rent-dep");
  if (!rentDeposit || !state.reminderBanner || state.paid[rentDeposit.id] || !needsReference(rentDeposit, state.references)) {
    return null;
  }
  return (
    <div className="banner warn" role="status">
      <Icon name="bell" size={22} />
      <span className="grow">
        <b>{t("bannerTitle", { title: itemText(rentDeposit, "title"), n: daysUntil(rentDeposit.due) })}</b>{" "}
        {t("bannerBody", { doc: t(`doc_${rentDeposit.doc}`), payee: rentDeposit.payeeShort })}
      </span>
      <button
        type="button"
        className="btn ink sm"
        onClick={() => dispatch({ type: "select", id: rentDeposit.id, term: "payment reference" })}
      >
        {t("review")}
      </button>
      <button type="button" className="x-btn" onClick={() => dispatch({ type: "hideBanner" })} aria-label={t("dismiss")}>
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}

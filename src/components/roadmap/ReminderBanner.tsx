"use client";

import { needsReference } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

export function ReminderBanner() {
  const { items, state, dispatch } = useApp();
  const rentDeposit = items.find((i) => i.id === "rent-dep");
  if (!rentDeposit || !state.reminderBanner || state.paid[rentDeposit.id] || !needsReference(rentDeposit, state.references)) {
    return null;
  }
  return (
    <div className="banner warn" role="status">
      <Icon name="bell" size={22} />
      <span className="grow">
        <b>Rent deposit due in 18 days.</b> We couldn&apos;t find a payment reference in your tenancy agreement. Ask{" "}
        {rentDeposit.payeeShort} before you pay.
      </span>
      <button
        type="button"
        className="btn ink sm"
        onClick={() => dispatch({ type: "select", id: rentDeposit.id, term: "payment reference" })}
      >
        Review
      </button>
      <button type="button" className="x-btn" onClick={() => dispatch({ type: "hideBanner" })} aria-label="Dismiss reminder">
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}

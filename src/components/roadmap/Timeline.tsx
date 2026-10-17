"use client";

import { ROADMAP } from "@/lib/demo-data";
import { dayAndMonth, statusOf, summarise } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

export function Timeline() {
  const { t, items, state, dispatch, money } = useApp();
  const { sorted } = summarise(items, state.paid);
  const docCount = new Set(ROADMAP.map((i) => i.doc)).size;

  return (
    <section className="card" style={{ flex: "999 1 480px", display: "grid", gap: 16 }} aria-labelledby="roadmap-heading">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 id="roadmap-heading" className="disp" style={{ fontSize: 30 }}>{t("roadmap")}</h2>
          <span className="muted" style={{ fontSize: 13 }}>Built from {docCount} documents · every item checked by you</span>
        </div>
        <button type="button" className="btn ghost sm" onClick={() => dispatch({ type: "setReminder", open: true })}>
          <Icon name="bell" size={16} />
          Trigger rent reminder
        </button>
      </div>
      <ul className="tl">
        {sorted.map((item) => {
          const paid = !!state.paid[item.id];
          const status = statusOf(item, paid, state.references);
          const { day, month } = dayAndMonth(item.due);
          return (
            <li key={item.id}>
              <button
                type="button"
                className="tl-item"
                aria-pressed={state.selectedId === item.id}
                onClick={() => dispatch({ type: "select", id: item.id })}
              >
                <span className="tdate"><b>{day}</b><small>{month}</small></span>
                <span className={`dot ${status.dot}`}>{paid && <Icon name="check" size={12} stroke={3.5} />}</span>
                <span className="what">
                  <b>{item.title}</b>
                  <small>{paid ? "Paid with Wise" : item.note}</small>
                </span>
                <span className="amt">
                  <b className="num">{money(item.amountGbp)}</b>
                  <span className={`pill ${status.pill}`}>{status.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

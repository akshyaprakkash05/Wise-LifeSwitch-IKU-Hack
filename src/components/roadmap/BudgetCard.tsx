"use client";

import { BUDGET } from "@/lib/demo-data";
import { useApp } from "@/state/app-state";

const ROWS = [
  { key: "tuition", label: "tuition", color: "var(--forest)" },
  { key: "housing", label: "housing", color: "var(--lime)" },
  { key: "living", label: "livingPeriod", color: "var(--saffron)" },
] as const;

export function BudgetCard() {
  const { t, money, moneyAlt } = useApp();
  const total = BUDGET.tuition + BUDGET.housing + BUDGET.living;

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
        <span className="eyebrow">{t("budget")}</span>
        <span className="pill p-idle">{t("livingEstimate")}</span>
      </div>
      <div>
        <span className="big num" style={{ fontSize: 38 }}>{money(total)}</span>{" "}
        <span className="mono num muted" style={{ fontSize: 13 }}>≈ {moneyAlt(total)}</span>
      </div>
      <div style={{ display: "flex", gap: 4, height: 14 }} aria-hidden="true">
        {ROWS.map((r) => (
          <span key={r.key} style={{ flex: BUDGET[r.key], borderRadius: 5, background: r.color }} />
        ))}
      </div>
      <ul style={{ display: "grid", gap: 4, fontSize: 14 }}>
        {ROWS.map((r) => (
          <li key={r.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: r.color }} />
            <span style={{ flex: 1 }}>{t(r.label)}</span>
            <b className="num">{money(BUDGET[r.key])}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

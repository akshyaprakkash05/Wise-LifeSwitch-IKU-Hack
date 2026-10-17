"use client";

import type { summarise } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressCard({ summary }: { summary: ReturnType<typeof summarise> }) {
  const { t, money, items } = useApp();
  const { percent, paidCount, paidAmount, total } = summary;
  const arc = (Math.max(percent, 1) / 100) * CIRCUMFERENCE;

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div className="progress-ring">
        <svg width="118" height="118" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#E8EDE3" strokeWidth="11" />
          <circle
            className="arc"
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke="#163300"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${arc.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <b className="num">{percent}%</b>
      </div>
      <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <span className="eyebrow">{t("progress")}</span>
        <span className="disp num" style={{ fontSize: 30 }}>
          {paidCount} of {items.length} paid
        </span>
        <span className="muted num" style={{ fontSize: 14 }}>
          {money(paidAmount)} sent · {money(total - paidAmount)} to go
        </span>
      </div>
    </div>
  );
}

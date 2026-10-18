"use client";

import Link from "next/link";
import { CIRCLE_FEED } from "@/lib/demo-data";
import { isMessageKey } from "@/lib/i18n";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

export function CircleCard() {
  const { items, state, t, itemText, fmt } = useApp();
  // Payments made in this session appear in the family feed, newest first.
  const fresh = items
    .filter((i) => state.paid[i.id] && i.id !== "hold")
    .map((i) => ({ who: t("you"), text: t("feedPaid", { title: lowerFirst(itemText(i, "title")) }), time: t("justNow") }));
  const seeded = CIRCLE_FEED.map((f) => ({
    who: isMessageKey(f.who) ? t(f.who) : f.who,
    text: t(f.text),
    time: fmt.ago(f.hoursAgo),
  }));
  const feed = [...fresh, ...seeded].slice(0, 3);

  return (
    <div className="card" style={{ display: "grid", gap: 12, background: "var(--saffron-soft)", borderColor: "#F6D3A2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="eyebrow" style={{ color: "var(--saffron-ink)" }}>{t("circleTitle")}</span>
        <span style={{ display: "flex" }} aria-hidden="true">
          <span className="av" style={{ width: 30, height: 30, fontSize: 13, background: "#FF9A1F", color: "#5C3200", border: "2px solid var(--saffron-soft)" }}>M</span>
          <span className="av" style={{ width: 30, height: 30, fontSize: 13, background: "#FFD7EF", color: "#5A1240", marginLeft: -8, border: "2px solid var(--saffron-soft)" }}>R</span>
        </span>
      </div>
      <ul style={{ display: "grid", gap: 8, fontSize: 14 }} aria-live="polite">
        {feed.map((f, i) => (
          <li key={i}>
            <b>{f.who}</b> {f.text} <span className="mono muted" style={{ fontSize: 11 }}>· {f.time}</span>
          </li>
        ))}
      </ul>
      <Link href="/circle" className="btn saffron sm" style={{ justifySelf: "start" }}>
        {t("openCircle")}
        <Icon name="arrow" size={16} stroke={2.4} />
      </Link>
    </div>
  );
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase() + text.slice(1);
}

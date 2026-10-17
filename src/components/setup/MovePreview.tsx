"use client";

import { DESTINATIONS, ORIGINS, findCountry } from "@/lib/places";
import type { Move } from "@/lib/types";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

const STEPS = ["step1", "step2", "step3", "step4"] as const;

/** Live boarding-pass style preview that updates as the user fills in the form. */
export function MovePreview({ move }: { move: Move }) {
  const from = findCountry(ORIGINS, move.from);
  const to = findCountry(DESTINATIONS, move.to);
  const { t, state } = useApp();
  const course = move.course.trim();
  const [before, after] = t("previewText", {
    from: from.city,
    to: to.city,
    purpose: t(`pl_${move.purpose}`),
    course: course ? ` (${course})` : "",
  }).split("{hint}");

  return (
    <aside className="card move-preview" aria-label={t("livePreview")} aria-live="polite">
      <span className="eyebrow" style={{ color: "var(--lime)" }}>{t("livePreview")}</span>

      <div className="preview-route">
        <div>
          <div className="code">{from.code}</div>
          <div className="city">{from.city}</div>
        </div>
        <span className="preview-plane" aria-hidden="true"><Icon name="plane" size={26} /></span>
        <div style={{ textAlign: "right" }}>
          <div className="code">{to.code}</div>
          <div className="city">{to.city}</div>
        </div>
      </div>

      <p style={{ color: "var(--rail-text)" }}>
        {before}
        <b style={{ color: "#fff" }}>{t(`ph_${move.purpose}`).toLocaleLowerCase(state.lang)}</b>
        {after}
      </p>

      <div className="preview-money">
        <span className="mono">{from.currency}</span>
        <Icon name="arrow" size={16} stroke={2.4} />
        <span className="mono">{to.currency}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--rail-text)" }}>{t("paidThroughWise")}</span>
      </div>

      <ol className="preview-steps">
        {STEPS.map((step, n) => (
          <li key={step}>
            <span className="mono">{n + 1}</span>
            {t(step)}
          </li>
        ))}
      </ol>
    </aside>
  );
}

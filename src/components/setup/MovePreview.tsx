"use client";

import { DESTINATIONS, ORIGINS, PURPOSES, findCountry } from "@/lib/places";
import type { Move } from "@/lib/types";
import { Icon } from "../Icon";

const STEPS = ["Read your documents", "Build your money roadmap", "Prepare each payment with Wise", "Bring your family along"];

/** Live boarding-pass style preview that updates as the user fills in the form. */
export function MovePreview({ move }: { move: Move }) {
  const from = findCountry(ORIGINS, move.from);
  const to = findCountry(DESTINATIONS, move.to);
  const purpose = PURPOSES.find((p) => p.value === move.purpose) ?? PURPOSES[0];

  return (
    <aside className="card move-preview" aria-label="Preview of your move" aria-live="polite">
      <span className="eyebrow" style={{ color: "var(--lime)" }}>Live preview</span>

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
        {from.city} to {to.city} for {move.purpose.toLowerCase()}
        {move.course.trim() ? ` (${move.course.trim()})` : ""}. LifeSwitch will look for{" "}
        <b style={{ color: "#fff" }}>{purpose.hint.toLowerCase()}</b> in your documents.
      </p>

      <div className="preview-money">
        <span className="mono">{from.currency}</span>
        <Icon name="arrow" size={16} stroke={2.4} />
        <span className="mono">{to.currency}</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--rail-text)" }}>Paid through Wise</span>
      </div>

      <ol className="preview-steps">
        {STEPS.map((step, n) => (
          <li key={step}>
            <span className="mono">{n + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </aside>
  );
}

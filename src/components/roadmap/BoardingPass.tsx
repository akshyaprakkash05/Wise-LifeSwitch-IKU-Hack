"use client";

import { DOCS, PERSON, ROADMAP } from "@/lib/demo-data";
import { dayAndMonth, daysUntil, type summarise } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

type Summary = ReturnType<typeof summarise>;

export function BoardingPass({ summary }: { summary: Summary }) {
  const { t, money, moneyAlt, dispatch, items } = useApp();
  const { next, percent, paidCount } = summary;
  const docsRead = new Set(ROADMAP.map((i) => i.doc)).size;
  const planeLeft = Math.min(92, Math.max(4, percent));

  return (
    <section className="pass" aria-label="Your move">
      <div className="pass-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="eyebrow" style={{ color: "var(--lime)" }}>LifeSwitch boarding pass</span>
          <span className="pill p-fam">{PERSON.purpose} · {PERSON.to.city}</span>
        </div>
        <div className="pass-route">
          <div>
            <div className="code">{PERSON.from.code}</div>
            <div className="city">{PERSON.from.city}, {PERSON.from.country}</div>
          </div>
          <div className="flight">
            <svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2 34 C 60 2, 140 2, 198 34" fill="none" stroke="#9FE870" strokeWidth="2" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="plane" style={{ left: `${planeLeft}%` }}>
              <Icon name="plane" size={22} />
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="code">{PERSON.to.code}</div>
            <div className="city">{PERSON.to.city}</div>
          </div>
        </div>
        <div className="pass-fields">
          <div><span>Passenger</span><b>{PERSON.fullName}</b></div>
          <div><span>Course</span><b>{PERSON.course}</b></div>
          <div><span>Documents</span><b>{docsRead} read by AI · {Object.keys(DOCS).length - docsRead} to add</b></div>
          <div><span>{t("progress")}</span><b className="num">{percent}% · {paidCount}/{items.length} paid</b></div>
        </div>
      </div>

      <div className="pass-stub">
        {next ? (
          <>
            <span className="eyebrow" style={{ color: "var(--forest)" }}>
              {t("next")} · {daysUntil(next.due) > 0 ? `in ${daysUntil(next.due)} days` : "due now"}
            </span>
            <span className="big num">{money(next.amountGbp)}</span>
            <span className="mono num" style={{ fontSize: 13 }}>≈ {moneyAlt(next.amountGbp)}</span>
            <b>
              {next.title} · due {dayAndMonth(next.due).day} {dayAndMonth(next.due).month}
            </b>
            <button type="button" className="btn dark" onClick={() => dispatch({ type: "openPay", id: next.id })}>
              {t("payWise")}
              <Icon name="arrow" size={18} stroke={2.4} />
            </button>
            <div className="bar-code" aria-hidden="true" />
          </>
        ) : (
          <>
            <span className="big">All paid.</span>
            <b>Welcome to {PERSON.to.city}, {PERSON.name}.</b>
          </>
        )}
      </div>
    </section>
  );
}

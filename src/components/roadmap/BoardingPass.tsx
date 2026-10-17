"use client";

import { DOCS, PERSON, ROADMAP } from "@/lib/demo-data";
import { daysUntil, type summarise } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";

type Summary = ReturnType<typeof summarise>;

export function BoardingPass({ summary }: { summary: Summary }) {
  const { t, money, moneyAlt, dispatch, items, trip, itemText, fmt } = useApp();
  const { next, percent, paidCount } = summary;
  const docsRead = new Set(ROADMAP.map((i) => i.doc)).size;
  const planeLeft = Math.min(92, Math.max(4, percent));

  return (
    <section className="pass" aria-label={t("yourMove")}>
      <div className="pass-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="eyebrow" style={{ color: "var(--lime)" }}>{t("passTitle")}</span>
          <span className="pill p-fam">{t(`p_${trip.purpose}`)} · {trip.to.city}</span>
        </div>
        <div className="pass-route">
          <div>
            <div className="code">{trip.from.code}</div>
            <div className="city">{trip.from.city}, {fmt.country(trip.from)}</div>
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
            <div className="code">{trip.to.code}</div>
            <div className="city">{trip.to.city}</div>
          </div>
        </div>
        <div className="pass-fields">
          <div><span>{t("passenger")}</span><b>{PERSON.fullName}</b></div>
          {trip.course && <div><span>{t(trip.purpose === "Study" ? "course" : "role")}</span><b>{trip.course}</b></div>}
          <div><span>{t("documents")}</span><b>{t("docsRead", { read: docsRead, left: Object.keys(DOCS).length - docsRead })}</b></div>
          <div><span>{t("progress")}</span><b className="num">{t("passProgress", { p: percent, paid: paidCount, total: items.length })}</b></div>
        </div>
      </div>

      <div className="pass-stub">
        {next ? (
          <>
            <span className="eyebrow" style={{ color: "var(--forest)" }}>
              {t("next")} · {daysUntil(next.due) > 0 ? t("inDays", { n: daysUntil(next.due) }) : t("dueNow")}
            </span>
            <span className="big num">{money(next.amountGbp)}</span>
            <span className="mono num" style={{ fontSize: 13 }}>≈ {moneyAlt(next.amountGbp)}</span>
            <b>
              {itemText(next, "title")} · {t("dueOn", { date: fmt.shortDate(next.due) })}
            </b>
            <button type="button" className="btn dark" onClick={() => dispatch({ type: "openPay", id: next.id })}>
              {t("payWise")}
              <Icon name="arrow" size={18} stroke={2.4} />
            </button>
            <div className="bar-code" aria-hidden="true" />
          </>
        ) : (
          <>
            <span className="big">{t("allPaid")}</span>
            <b>{t("welcome", { city: trip.to.city, name: PERSON.name })}</b>
          </>
        )}
      </div>
    </section>
  );
}

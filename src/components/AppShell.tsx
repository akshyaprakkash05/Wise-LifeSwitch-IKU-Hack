"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { PERSON } from "@/lib/demo-data";
import { LANGS } from "@/lib/i18n";
import { NAV } from "@/lib/nav";
import { summarise } from "@/lib/roadmap";
import type { Currency, Lang } from "@/lib/types";
import { useApp } from "@/state/app-state";
import { Icon } from "./Icon";
import { PayWithWiseDialog } from "./roadmap/PayWithWiseDialog";
import { ReminderDialog } from "./roadmap/ReminderDialog";
import { Toast } from "./Toast";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <Rail />
      <div className="main">
        <TopBar />
        <main className="view" id="main">
          {children}
        </main>
      </div>
      <PayWithWiseDialog />
      <ReminderDialog />
      <Toast />
    </div>
  );
}

function Rail() {
  const pathname = usePathname();
  const { t, items, state, dispatch, notify } = useApp();
  const unpaid = items.length - summarise(items, state.paid).paidCount;

  return (
    <aside className="rail">
      <div className="brand">
        <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
          <rect width="38" height="38" rx="12" fill="#9FE870" />
          <circle cx="13" cy="19" r="5.5" fill="none" stroke="#163300" strokeWidth="3" />
          <path d="M19 19h8m-3.5-4 4 4-4 4" fill="none" stroke="#163300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="29" cy="9" r="3.5" fill="#FF9A1F" />
        </svg>
        <div>
          <b>LifeSwitch</b>
          <small>Wise track · IKU</small>
        </div>
      </div>
      <nav className="nav" aria-label={t("mainMenu")}>
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Fragment key={item.href}>
              {item.breakBefore && <hr />}
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} />
                <span>{t(item.label)}</span>
                {item.href === "/payments" && unpaid > 0 && <span className="tag">{unpaid}</span>}
              </Link>
            </Fragment>
          );
        })}
      </nav>
      <div className="rail-foot">
        <p>{t("demoNote")}</p>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "reset" });
            notify(t("resetDone", { name: PERSON.name }));
          }}
        >
          {t("resetDemo")}
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  const { state, dispatch, trip, t } = useApp();

  return (
    <div className="topbar">
      <span className="crumb">
        {trip.from.code} → {trip.to.code} · {t(`p_${trip.purpose}`)}
      </span>
      <div className="field-inline">
        <label htmlFor="lang-select" aria-label={t("language")}>
          <Icon name="globe" size={16} />
        </label>
        <select
          id="lang-select"
          value={state.lang}
          onChange={(e) => dispatch({ type: "setLang", lang: e.target.value as Lang })}
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <div className="segs" role="group" aria-label={t("showAmountsIn")}>
        {(["GBP", "USD"] as Currency[]).map((c) => (
          <button
            key={c}
            type="button"
            className="seg"
            aria-pressed={state.currency === c}
            onClick={() => dispatch({ type: "setCurrency", currency: c })}
          >
            {c === "GBP" ? "£ GBP" : "$ USD"}
          </button>
        ))}
      </div>
      <span className="avatar" aria-label={PERSON.name}>
        {PERSON.name[0]}
      </span>
    </div>
  );
}

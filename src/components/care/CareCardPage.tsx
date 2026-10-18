"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CASH_WATCH_OVER,
  DEFAULT_SETTINGS,
  LIMIT_MAX,
  LIMIT_MIN,
  LIMIT_STEP,
  SEED_SPENDING,
  TEST_PAYMENTS,
  assessSpend,
  normalizeSettings,
  type CareSettings,
  type ShopKind,
  type Spend,
} from "@/lib/care/rules";
import { careT, type CareKey } from "@/lib/care/strings";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import "../tabs/tabs.css";
import "./care.css";

const STORAGE_KEY = "lifeswitch-care-v1";
const SHOPS: ShopKind[] = ["gambling", "marketplace", "cash", "phone"];

interface Saved {
  settings: CareSettings;
  added: Spend[];
}

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    const added = Array.isArray(parsed.added)
      ? parsed.added.filter((s): s is Spend => !!s && typeof s.merchant === "string" && typeof s.amountGbp === "number").slice(0, 20)
      : [];
    return { settings: normalizeSettings(parsed.settings), added };
  } catch {
    return null;
  }
}

export function CareCardPage() {
  const { state, money, notify, t: appT } = useApp();
  const t = useCallback((key: CareKey, vars?: Record<string, string | number>) => careT(state.lang, key, vars), [state.lang]);
  const [settings, setSettings] = useState<CareSettings>(DEFAULT_SETTINGS);
  const [added, setAdded] = useState<Spend[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const hydrated = useRef(false);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Restore from this browser after the first render, so server and client HTML match.
  useEffect(() => {
    const saved = load();
    if (saved) {
      setSettings(saved.settings);
      setAdded(saved.added);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, added } satisfies Saved));
    } catch {
      /* storage unavailable: keep working in memory */
    }
  }, [settings, added]);

  useEffect(() => () => clearTimeout(limitTimer.current), []);

  const shown = (what: string) => notify(t("shown", { what }));
  const shopLabel = (kind: ShopKind) => t(`w_${kind}`, { amount: money(CASH_WATCH_OVER) });

  function toggleShop(kind: ShopKind) {
    const on = !settings.watch[kind];
    setSettings({ ...settings, watch: { ...settings.watch, [kind]: on } });
    shown(t(on ? "ch_on" : "ch_off", { shop: shopLabel(kind) }));
  }

  function setLimit(value: number) {
    setSettings((s) => ({ ...s, dailyLimit: value }));
    // Tell Joseph once the slider settles, not on every step.
    clearTimeout(limitTimer.current);
    limitTimer.current = setTimeout(() => shown(t("ch_limit", { amount: money(value) })), 700);
  }

  function setMode(mode: CareSettings["mode"]) {
    if (mode === settings.mode) return;
    setSettings({ ...settings, mode });
    shown(t(mode === "alert" ? "ch_alert" : "ch_block"));
  }

  function tryPayment() {
    const sample = TEST_PAYMENTS[added.length % TEST_PAYMENTS.length];
    const spend: Spend = { ...sample, id: `t-${Date.now().toString(36)}` };
    setAdded([spend, ...added].slice(0, 20));
    setFresh(spend.id);
    const verdict = assessSpend(spend, settings);
    const vars = { merchant: spend.merchant, amount: money(spend.amountGbp, 2) };
    notify(t(verdict.status === "approved" ? "newApproved" : verdict.status === "alert" ? "newAlert" : "newPaused", vars));
  }

  const spending = [...added, ...SEED_SPENDING];
  const limitPct = ((settings.dailyLimit - LIMIT_MIN) / (LIMIT_MAX - LIMIT_MIN)) * 100;

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{appT("nav_care")}</h1>
          <p>{appT("sub_care")}</p>
        </div>
      </div>

      <div className="care-banner">
        <Icon name="heart" size={20} />
        <p>
          <b>{t("bannerLead")}</b> {t("bannerBody")}
        </p>
      </div>

      <div className="care-cols">
        <div className="care-side">
          <div className="care-card" role="img" aria-label="Care Card, Visa debit ending 2048, Joseph O'Neill">
            <span className="care-chip" aria-hidden="true" />
            <span className="care-ring" aria-hidden="true" />
            <span className="care-brand">{t("cardName")}</span>
            <span className="care-number mono" aria-hidden="true">•••• •••• •••• 2048</span>
            <span className="care-holder">JOSEPH O&apos;NEILL</span>
            <span className="care-scheme mono">VISA DEBIT</span>
          </div>

          <section className="card care-box">
            <div className="care-limit-head">
              <label htmlFor="care-limit">{t("limitTitle")}</label>
              <b className="disp num">{money(settings.dailyLimit)}</b>
            </div>
            <input
              id="care-limit"
              className="care-range"
              type="range"
              min={LIMIT_MIN}
              max={LIMIT_MAX}
              step={LIMIT_STEP}
              value={settings.dailyLimit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ ["--fill" as string]: `${limitPct}%` }}
            />
            <p className="muted care-note">{t("limitNote")}</p>
          </section>

          <section className="card care-box">
            <span className="eyebrow mono" id="care-mode-label">{t("unusualTitle")}</span>
            <div className="segs" role="group" aria-labelledby="care-mode-label" style={{ justifySelf: "start" }}>
              <button type="button" className="seg" aria-pressed={settings.mode === "alert"} onClick={() => setMode("alert")}>
                {t("alertMe")}
              </button>
              <button type="button" className="seg" aria-pressed={settings.mode === "block"} onClick={() => setMode("block")}>
                {t("blockIt")}
              </button>
            </div>
            <p className="muted care-note">{t(settings.mode === "alert" ? "alertNote" : "blockNote")}</p>
          </section>
        </div>

        <div className="care-main">
          <section className="card">
            <h2 className="disp care-h2">{t("watchTitle")}</h2>
            <ul>
              {SHOPS.map((kind) => (
                <li key={kind} className="care-row">
                  <span className="grow" id={`watch-${kind}`}>{shopLabel(kind)}</span>
                  <button
                    type="button"
                    role="switch"
                    className="switch"
                    aria-checked={settings.watch[kind]}
                    aria-labelledby={`watch-${kind}`}
                    onClick={() => toggleShop(kind)}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="care-recent-head">
              <h2 className="disp care-h2">{t("recentTitle")}</h2>
              <button type="button" className="btn ghost sm" onClick={tryPayment}>
                <Icon name="plus" size={16} />
                {t("tryPayment")}
              </button>
            </div>
            <ul aria-live="polite">
              {spending.map((s) => {
                const v = assessSpend(s, settings);
                const ok = v.status === "approved";
                return (
                  <li key={s.id} className={`care-spend${fresh === s.id ? " fresh" : ""}`}>
                    <span className={`icon-tile ${ok ? "soft" : "fam"}`}>
                      <Icon name={ok ? "check" : "alert"} size={18} />
                    </span>
                    <span className="text">
                      <b>{s.merchant}</b>
                      <small>
                        {t(`c_${s.category}`)}
                        {!ok && v.reason === "limit" ? ` · ${t("overLimit")}` : ""}
                      </small>
                    </span>
                    <span className="right">
                      <b className="num">{money(s.amountGbp, 2)}</b>
                      <span className={`pill ${ok ? "p-ok" : "p-fam"}`}>{t(`st_${v.status}`)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

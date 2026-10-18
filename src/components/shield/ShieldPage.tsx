"use client";

import Link from "next/link";
import { useState } from "react";
import { riskyPhrases, type ScamReport } from "@/lib/scam/shield";
import type { ReadMessage } from "@/lib/shield/parse";
import { SAMPLE_FEE_INVOICE, SAMPLE_SCAM_MESSAGE } from "@/lib/tabs/samples";
import type { ExtractionResult } from "@/lib/tabs/types";
import type { BankDetails } from "@/lib/types";
import { Icon } from "../Icon";
import "../tabs/tabs.css";
import "./shield-page.css";
import { useSHT } from "./useSHT";

type Mode = "paste" | "upload";
type Draft = { payee: string; amount: string; currency: string; bank: Required<{ [K in keyof BankDetails]: string }> };

const toDraft = (r: ReadMessage): Draft => ({
  payee: r.payee ?? "",
  amount: r.amount == null ? "" : String(r.amount),
  currency: r.currency ?? "GBP",
  bank: {
    account_name: r.bank.account_name ?? "",
    iban: r.bank.iban ?? "",
    bic: r.bank.bic ?? "",
    sort_code: r.bank.sort_code ?? "",
    account_number: r.bank.account_number ?? "",
  },
});

const fromExtraction = (x: ExtractionResult): ReadMessage => {
  const item = x.items[0];
  return {
    payee: item?.payee ?? item?.bank?.account_name ?? null,
    amount: item?.amount ?? null,
    currency: item?.currency ?? null,
    bank: item?.bank ?? {},
    fullText: x.fullText,
    readBy: x.readBy === "gemini" ? "gemini" : "patterns",
  };
};

export function ShieldPage() {
  const t = useSHT();
  const [mode, setMode] = useState<Mode>("paste");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read, setRead] = useState<ReadMessage | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [report, setReport] = useState<ScamReport | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function assess(d: Draft, fullText: string) {
    const bank = Object.fromEntries(Object.entries(d.bank).map(([k, v]) => [k, v.trim() || null])) as BankDetails;
    const res = await fetch("/api/scam-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item: { payee: d.payee.trim() || null, bank, source_text: fullText, amount: Number(d.amount) || null, currency: d.currency },
      }),
    });
    if (!res.ok) throw new Error(t("errCheck"));
    setReport((await res.json()) as ScamReport);
    setConfirmed(false);
  }

  async function run(getRead: () => Promise<ReadMessage>) {
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const r = await getRead();
      const d = toDraft(r);
      setRead(r);
      setDraft(d);
      await assess(d, r.fullText);
    } catch (e) {
      setError((e as Error).message || t("errCheck"));
    } finally {
      setBusy(false);
    }
  }

  const readText = (msg: string) =>
    run(async () => {
      const res = await fetch("/api/shield/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: msg }) });
      if (!res.ok) throw new Error(t("errRead"));
      return (await res.json()) as ReadMessage;
    });

  const readFile = (file: File) =>
    run(async () => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      if (!res.ok) throw new Error(t("errRead"));
      const x = (await res.json()) as ExtractionResult;
      setText(x.fullText);
      return fromExtraction(x);
    });

  function trySample(sample: ExtractionResult) {
    setMode("paste");
    setText(sample.fullText);
    readText(sample.fullText);
  }

  async function recheck() {
    if (!draft || !read) return;
    setBusy(true);
    setError("");
    try {
      await assess(draft, read.fullText);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const setBank = (k: keyof Draft["bank"], v: string) => setDraft((d) => d && { ...d, bank: { ...d.bank, [k]: v } });

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{t("title")}</h1>
          <p>{t("sub")}</p>
        </div>
      </div>

      <div className="sh-cols">
        <div style={{ display: "grid", gap: 16 }}>
          <section className="card" style={{ display: "grid", gap: 12 }}>
            <div className="segs" role="tablist" aria-label={t("title")} style={{ justifySelf: "start" }}>
              {(["paste", "upload"] as const).map((m) => (
                <button key={m} id={`shield-tab-${m}`} type="button" role="tab" className="seg" aria-selected={mode === m} onClick={() => setMode(m)}>
                  {m === "paste" ? t("paste") : t("upload")}
                </button>
              ))}
            </div>

            {mode === "paste" ? (
              <form
                style={{ display: "grid", gap: 10 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) readText(text);
                }}
              >
                <label className="flabel">
                  {t("pasteLabel")}
                  <textarea id="shield-text" className="input sh-text" placeholder={t("pastePlaceholder")} value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} />
                </label>
                <button type="submit" className="btn dark" disabled={busy || !text.trim()} style={{ justifySelf: "start" }}>
                  {busy ? <span className="spin" aria-hidden="true" /> : <Icon name="shield" size={18} />} {busy ? t("checking") : t("check")}
                </button>
              </form>
            ) : (
              <label htmlFor="shield-file" className="btn ghost" style={{ justifySelf: "start", cursor: "pointer" }}>
                {busy ? <span className="spin" aria-hidden="true" /> : <Icon name="upload" size={18} />} {busy ? t("checking") : t("chooseFile")}
                <input
                  id="shield-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="sr-only-x"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button type="button" className="btn ghost sm" disabled={busy} onClick={() => trySample(SAMPLE_SCAM_MESSAGE)}>{t("tryScam")}</button>
              <button type="button" className="btn ghost sm" disabled={busy} onClick={() => trySample(SAMPLE_FEE_INVOICE)}>{t("tryReal")}</button>
            </div>
            {error && <div className="banner warn" role="alert"><Icon name="alert" size={18} />{error}</div>}
          </section>

          {draft && read && (
            <section className="card" style={{ display: "grid", gap: 12 }}>
              <span className="eyebrow">{t("whatWeRead")}</span>
              <p className="muted" style={{ fontSize: 13 }}>{read.readBy === "gemini" ? t("readByAi") : t("readByPatterns")}</p>
              <form
                className="sh-fields"
                onSubmit={(e) => {
                  e.preventDefault();
                  recheck();
                }}
              >
                <label className="flabel wide">{t("payee")}<input id="sh-payee" className="input" value={draft.payee} onChange={(e) => setDraft({ ...draft, payee: e.target.value })} /></label>
                <label className="flabel">{t("amount")}<input id="sh-amount" className="input mono" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></label>
                <label className="flabel">{t("accountName")}<input id="sh-acc-name" className="input" value={draft.bank.account_name} onChange={(e) => setBank("account_name", e.target.value)} /></label>
                <label className="flabel">{t("sortCode")}<input id="sh-sort" className="input mono" value={draft.bank.sort_code} onChange={(e) => setBank("sort_code", e.target.value)} /></label>
                <label className="flabel">{t("accountNumber")}<input id="sh-acc-no" className="input mono" value={draft.bank.account_number} onChange={(e) => setBank("account_number", e.target.value)} /></label>
                <label className="flabel">{t("iban")}<input id="sh-iban" className="input mono" value={draft.bank.iban} onChange={(e) => setBank("iban", e.target.value)} /></label>
                <label className="flabel">{t("bic")}<input id="sh-bic" className="input mono" value={draft.bank.bic} onChange={(e) => setBank("bic", e.target.value)} /></label>
                <button type="submit" className="btn ghost sm wide" disabled={busy} style={{ justifySelf: "start" }}>{t("recheck")}</button>
              </form>
            </section>
          )}
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          {report && read ? <Report report={report} text={read.fullText} confirmed={confirmed} onConfirm={setConfirmed} /> : (
            <section className="card" style={{ display: "grid", gap: 8 }}>
              <span className="eyebrow" style={{ display: "flex", gap: 6, alignItems: "center" }}><Icon name="shield" size={14} />{t("title")}</span>
              <p className="muted">{t("aiNote")}</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function Report({ report, text, confirmed, onConfirm }: { report: ScamReport; text: string; confirmed: boolean; onConfirm: (v: boolean) => void }) {
  const t = useSHT();
  const verdict = report.level === "high" ? t("verdictHigh") : report.level === "medium" ? t("verdictMedium") : t("verdictLow");
  const canPay = !report.detailsInvalid && (report.level !== "high" || confirmed);

  const steps =
    report.level === "high"
      ? [t("stepDontPay"), t("stepCall"), t("stepNeverGift"), t("stepReport"), t("stepForward"), t("stepBank")]
      : report.level === "medium"
        ? [t("stepMediumCheck"), t("stepCall")]
        : [t("stepLowGo")];

  return (
    <section className={`shield ${report.level}`} aria-live="polite">
      <div className="sh-verdict">
        <Icon name={report.level === "low" ? "check" : "alert"} size={30} />
        <div style={{ flex: 1 }}>
          <span className="eyebrow">{t("title")} · {t("risk", { score: report.score })}</span>
          <h2 className="disp">{verdict}</h2>
        </div>
      </div>
      <div className="sh-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={report.score} aria-label={t("risk", { score: report.score })}>
        <span style={{ width: `${Math.max(4, report.score)}%` }} />
      </div>
      <p style={{ fontSize: 14 }}>{report.advice}</p>

      {text.trim() && (
        <div style={{ display: "grid", gap: 6 }}>
          <span className="eyebrow">{t("inMessage")}</span>
          <Highlighted text={text} />
          {riskyPhrases(text).length > 0 && <span className="muted" style={{ fontSize: 12 }}>{t("highlightNote")}</span>}
        </div>
      )}

      {report.signals.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <span className="eyebrow">{t("why")}</span>
          <ul style={{ display: "grid", gap: 8 }}>
            {report.signals.map((s) => (
              <li key={s.code} className="signal"><b>⚠ {s.title}</b><span>{s.detail}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ fontSize: 14, display: "grid", gap: 4 }}>
        <span className="eyebrow">{t("bankCheck")}</span>
        {report.bankIssues.length === 0 ? <p>✓ {t("bankOk")}</p> : (
          <ul style={{ display: "grid", gap: 4 }}>{report.bankIssues.map((b) => <li key={b.code}><b>{b.message}</b> {b.fix}</li>)}</ul>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <span className="eyebrow">{t("nextSteps")}</span>
        <ul className="sh-steps">{steps.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>

      {report.needsConfirmation && (
        <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, cursor: "pointer" }}>
          <input id="shield-confirm" type="checkbox" checked={confirmed} onChange={(e) => onConfirm(e.target.checked)} style={{ width: 22, height: 22, accentColor: "#b42318", marginTop: 1 }} />
          <span>{t("confirmGenuine")}</span>
        </label>
      )}
      {canPay && (
        <Link href="/payments" className={report.level === "high" ? "btn ink" : "btn"} style={{ justifySelf: "start" }}>
          <Icon name="lock" size={18} /> {t("continuePay")}
        </Link>
      )}
      <span className="muted" style={{ fontSize: 12 }}>{t("aiNote")}</span>
    </section>
  );
}

function Highlighted({ text }: { text: string }) {
  const spans = riskyPhrases(text);
  const parts: React.ReactNode[] = [];
  let at = 0;
  spans.forEach((s, i) => {
    if (s.start > at) parts.push(text.slice(at, s.start));
    parts.push(<mark key={i} title={s.title}>{text.slice(s.start, s.end)}</mark>);
    at = s.end;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <div className="sh-quote">{parts}</div>;
}

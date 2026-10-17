"use client";

import { useEffect, useState } from "react";
import type { ScamInput, ScamReport } from "@/lib/scam/shield";
import { Icon } from "../Icon";
import { useT } from "./useT";

interface Props {
  item: ScamInput;
  /** Called when the student may go ahead: details are valid, and the risk isn't high or they confirmed they checked. */
  onProceed: (confirmedRisk: boolean) => void;
  proceedLabel: string;
  busy?: boolean;
}

/** Runs the server-side scam check for one payment and shows why it was flagged. */
export function ScamShield({ item, onProceed, proceedLabel, busy = false }: Props) {
  const t = useT();
  const [report, setReport] = useState<ScamReport | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const body = JSON.stringify({ item });

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError("");
    setConfirmed(false);
    fetch("/api/scam-check", { method: "POST", headers: { "Content-Type": "application/json" }, body })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || `Check failed (${res.status})`);
        return res.json() as Promise<ScamReport>;
      })
      .then((r) => !cancelled && setReport(r))
      .catch((e: Error) => !cancelled && setError(e.message || "The safety check couldn't run. Try again."));
    return () => {
      cancelled = true;
    };
  }, [body]);

  if (error) return <div className="banner warn" role="alert"><Icon name="alert" size={18} />{error}</div>;
  if (!report) {
    return (
      <div className="shield low" aria-busy="true" style={{ borderColor: "var(--line)", background: "var(--ground)" }}>
        <span style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="spin" aria-hidden="true" style={{ borderTopColor: "var(--forest)" }} />{t("scam.title")}…</span>
      </div>
    );
  }

  const title = report.level === "high" ? t("scam.high") : report.level === "medium" ? t("scam.medium") : t("scam.low");
  const canProceed = !report.detailsInvalid && (report.level !== "high" || confirmed);

  return (
    <section className={`shield ${report.level}`} aria-live="polite">
      <div style={{ display: "grid", gap: 4 }}>
        <span className="eyebrow" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Icon name="shield" size={14} />{t("scam.title")} · {report.level}
        </span>
        <h3 className="disp">{title}</h3>
        <p style={{ fontSize: 14 }}>{report.advice}</p>
      </div>
      {report.signals.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <span className="eyebrow">{t("scam.why")}</span>
          <ul style={{ display: "grid", gap: 8 }}>
            {report.signals.map((s) => (
              <li key={s.code} className="signal"><b>⚠ {s.title}</b><span>{s.detail}</span></li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ fontSize: 14 }}>
        <span className="eyebrow">{t("scam.bank_check")}</span>
        {report.bankIssues.length === 0 ? (
          <p>✓ {t("scam.bank_ok")}</p>
        ) : (
          <ul>{report.bankIssues.map((b) => <li key={b.code}><b>{b.message}</b> {b.fix}</li>)}</ul>
        )}
      </div>
      {report.needsConfirmation && (
        <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={busy} style={{ width: 22, height: 22, accentColor: "#b42318", marginTop: 1 }} />
          <span>{t("scam.confirm")}</span>
        </label>
      )}
      <button type="button" className={report.level === "high" ? "btn ink" : "btn"} disabled={!canProceed || busy} onClick={() => onProceed(confirmed)}>
        {busy ? <span className="spin" aria-hidden="true" /> : <Icon name="lock" size={18} />}
        {canProceed ? proceedLabel : report.detailsInvalid ? t("scam.fix_details") : t("scam.verify_first")}
      </button>
    </section>
  );
}

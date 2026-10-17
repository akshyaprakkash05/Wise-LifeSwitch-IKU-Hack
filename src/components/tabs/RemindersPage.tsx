"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { shortDate } from "@/lib/tabs/dates";
import { nextDue, reminderRows, validateReminder, type DueReminder, type ReminderDraft, type ReminderRow } from "@/lib/tabs/reminders";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import { Dialog } from "../roadmap/Dialog";
import "./tabs.css";
import { useT } from "./useT";

const EMPTY: ReminderDraft = { title: "", amount: "", repeats: "monthly", when: "" };

export function RemindersPage() {
  const t = useT();
  const router = useRouter();
  const { items, state, dispatch, money, notify } = useApp();
  const [popup, setPopup] = useState<DueReminder | "none" | null>(null);
  const [draft, setDraft] = useState<ReminderDraft>(EMPTY);
  const [errors, setErrors] = useState<ReturnType<typeof validateReminder>>({});
  const rows = reminderRows(items, state.paid, state.reminderOff, state.customReminders);

  const repeatLabel = (r: ReminderRow["repeats"]) => t(r === "once" ? "rem.once" : r === "weekly" ? "rem.weekly" : "rem.monthly");

  function toggle(r: ReminderRow) {
    dispatch(r.fromDocuments ? { type: "toggleItemReminder", id: r.id } : { type: "toggleCustomReminder", id: r.id });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateReminder(draft);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const entered = Number(draft.amount);
    // Amounts are stored in GBP; convert if the student typed dollars.
    const amountGbp = state.currency === "USD" ? Math.round((entered / state.fx.rate) * 100) / 100 : entered;
    dispatch({
      type: "addCustomReminder",
      reminder: { id: `rem-${Date.now().toString(36)}`, title: draft.title.trim().slice(0, 60), amountGbp, when: draft.when.trim().slice(0, 40), repeats: draft.repeats, enabled: true },
    });
    setDraft(EMPTY);
    notify(t("rem.added"));
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{t("rem.title")}</h1>
          <p>{t("rem.sub")}</p>
        </div>
        <button type="button" className="btn saffron" onClick={() => setPopup(nextDue(items, state.paid, state.reminderOff) ?? "none")}>
          <Icon name="bell" size={18} />{t("rem.trigger")}
        </button>
      </div>

      <div className="tab-cols">
        <section className="card" style={{ paddingBlock: 6 }}>
          <ul>
            {rows.map((r) => (
              <li key={r.id} className="list-row">
                <span className={`icon-tile ${r.fromDocuments ? "lime" : "fam"}`}><Icon name={r.fromDocuments ? "spark" : "bell"} size={18} /></span>
                <span className="text">
                  <b>{r.title} · <span className="num">{money(r.amountGbp)}</span></b>
                  <span className="sub">{r.when} · {repeatLabel(r.repeats)}{r.fromDocuments ? ` · ${t("rem.fromDocs")}` : ""}</span>
                </span>
                {!r.fromDocuments && (
                  <button type="button" className="ghost-x" aria-label={`${t("rem.delete")}: ${r.title}`} onClick={() => dispatch({ type: "removeCustomReminder", id: r.id })}>
                    <Icon name="x" size={16} />
                  </button>
                )}
                <button type="button" role="switch" className="switch" aria-checked={r.enabled} aria-label={t("rem.toggle", { title: r.title })} onClick={() => toggle(r)} />
              </li>
            ))}
          </ul>
        </section>

        <form className="card" onSubmit={submit} noValidate style={{ display: "grid", gap: 12 }}>
          <h2 className="disp" style={{ fontSize: 26 }}>{t("rem.add")}</h2>
          <label className="flabel">{t("rem.what")}
            <input className={`input${errors.title ? " bad" : ""}`} placeholder={t("rem.whatPh")} maxLength={60} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            {errors.title && <span className="err">{t("rem.errWhat")}</span>}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label className="flabel">{t("rem.amount", { cur: state.currency })}
              <input className={`input num${errors.amount ? " bad" : ""}`} type="number" min="0" step="0.01" inputMode="decimal" placeholder="25" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
            </label>
            <label className="flabel">{t("rem.repeats")}
              <select className="input" value={draft.repeats} onChange={(e) => setDraft({ ...draft, repeats: e.target.value as ReminderDraft["repeats"] })}>
                <option value="once">{t("rem.once")}</option>
                <option value="weekly">{t("rem.weekly")}</option>
                <option value="monthly">{t("rem.monthly")}</option>
              </select>
            </label>
          </div>
          {errors.amount && <span className="err">{t("rem.errAmount")}</span>}
          <label className="flabel">{t("rem.when")}
            <input className={`input${errors.when ? " bad" : ""}`} placeholder={t("rem.whenPh")} maxLength={40} value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value })} />
            {errors.when && <span className="err">{t("rem.errWhen")}</span>}
          </label>
          <button type="submit" className="btn dark"><Icon name="plus" size={18} />{t("rem.addBtn")}</button>
          <p className="muted" style={{ fontSize: 13 }}>{t("rem.footer")}</p>
        </form>
      </div>

      {popup && (
        <Dialog labelledBy="rem-pop-title" onClose={() => setPopup(null)}>
          <span className="pill p-fam" style={{ justifySelf: "start" }}><Icon name="bell" size={14} />{t("rem.popTitle")}</span>
          {popup === "none" ? (
            <>
              <h2 id="rem-pop-title" className="disp" style={{ fontSize: 28 }}>{t("rem.popTitle")}</h2>
              <p>{t("rem.nothingDue")}</p>
              <button type="button" className="btn ghost" onClick={() => setPopup(null)}>{t("explain.close")}</button>
            </>
          ) : (
            <>
              <h2 id="rem-pop-title" className="disp" style={{ fontSize: 30 }}>{popup.item.title}</h2>
              <span className="big num" style={{ fontSize: 48 }}>{money(popup.item.amountGbp)}</span>
              <p>
                {t("rem.popBody", {
                  title: popup.item.title,
                  amount: money(popup.item.amountGbp),
                  when: popup.days > 0 ? t("rem.inDays", { n: popup.days, date: shortDate(popup.item.due) }) : popup.days === 0 ? t("rem.today") : t("rem.overdue", { date: shortDate(popup.item.due) }),
                })}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  className="btn dark"
                  style={{ flex: "1 1 180px" }}
                  onClick={() => {
                    dispatch({ type: "select", id: popup.item.id });
                    setPopup(null);
                    router.push("/payments");
                  }}
                >
                  {t("rem.payNow")}<Icon name="arrow" size={18} stroke={2.4} />
                </button>
                <button type="button" className="btn ghost" onClick={() => setPopup(null)}>{t("rem.later")}</button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}

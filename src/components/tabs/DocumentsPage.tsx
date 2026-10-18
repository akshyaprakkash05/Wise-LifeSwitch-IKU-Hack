"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { DOCS, ROADMAP } from "@/lib/demo-data";
import { explain } from "@/lib/i18n";
import { checkBankDetails } from "@/lib/scam/bank";
import { toRoadmapItems } from "@/lib/tabs/convert";
import { GLOSSARY_TERMS } from "@/lib/tabs/glossary-terms";
import { reviewErrors } from "@/lib/tabs/normalize";
import type { ExtractedItem, ExtractionResult } from "@/lib/tabs/types";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import "./tabs.css";
import { useT } from "./useT";

const ACCEPT = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

interface Review {
  result: ExtractionResult;
  items: ExtractedItem[];
  showErrors: boolean;
}

const newId = () => `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function DocumentsPage() {
  const t = useT();
  const { state, dispatch, notify, t: tApp } = useApp();
  const [reading, setReading] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const busy = reading !== null || review !== null;

  // Documents already in Tara's roadmap, plus anything she uploaded here.
  const rows = useMemo(() => {
    const seeded = (["offer", "tenancy"] as const).map((kind) => ({
      id: kind, title: tApp(`docName_${kind}`), file: DOCS[kind].file, pages: kind === "offer" ? 3 : 12,
      found: ROADMAP.filter((i) => i.doc === kind).length, removable: false,
    }));
    const uploads = state.uploads.map((u) => ({ id: u.id, title: u.title, file: u.file, pages: u.pages, found: u.found, removable: true }));
    return [...uploads, ...seeded];
  }, [state.uploads, tApp]);

  async function extract(form: FormData, filename: string) {
    setError("");
    setReading(filename);
    try {
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(t(body.error === "type" ? "docs.errType" : body.error === "size" ? "docs.errSize" : body.error === "none" ? "docs.errNone" : "docs.errRead"));
      }
      const result = body as ExtractionResult;
      setReview({ result, items: result.items.map((i) => ({ ...i })), showErrors: false });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("docs.errRead"));
    } finally {
      setReading(null);
    }
  }

  function onFile(file: File | undefined) {
    if (!file || busy) return;
    if (!ACCEPT.includes(file.type)) return setError(t("docs.errType"));
    if (file.size > MAX_BYTES) return setError(t("docs.errSize"));
    const form = new FormData();
    form.append("file", file);
    extract(form, file.name);
  }

  function runSample(kind: "fee" | "scam") {
    if (busy) return;
    const form = new FormData();
    form.append("sample", kind);
    extract(form, kind === "fee" ? DOCS.invoice.file : "WhatsApp_Screenshot.png");
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    onFile(e.dataTransfer.files?.[0]);
  }

  function accept() {
    if (!review) return;
    if (review.items.some((i) => reviewErrors(i).length)) return setReview({ ...review, showErrors: true });
    const id = newId();
    const items = toRoadmapItems(review.items, id, review.result.fullText);
    dispatch({
      type: "addUpload",
      upload: { id, title: review.result.documentTitle, file: review.result.filename, pages: review.result.pages, found: items.length, readBy: review.result.readBy },
      items,
    });
    notify(t(items.length === 1 ? "docs.added1" : "docs.added", { n: items.length }));
    setReview(null);
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{t("docs.title")}</h1>
          <p>{t("docs.sub")}</p>
        </div>
      </div>

      <div className="tab-cols">
        <div className="tab-stack">
          <label
            className={`drop${dragging ? " on" : ""}${busy ? " busy" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="sr-only-x"
              disabled={busy}
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <span className="drop-icon">{reading ? <span className="spin" aria-hidden="true" /> : <Icon name="upload" size={24} />}</span>
            <span className="disp" style={{ fontSize: 26 }}>{reading ? t("docs.reading") : dragging ? t("docs.dropActive") : t("docs.drop")}</span>
            <span className="muted">
              {reading ? <span className="mono">{reading}</span> : <>{t("docs.dropHint")} <u style={{ color: "var(--ink)", fontWeight: 600 }}>{t("docs.choose")}</u></>}
            </span>
          </label>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <span className="muted" style={{ fontSize: 14 }}>{t("docs.noFile")}</span>
            <button type="button" className="chip-btn" disabled={busy} onClick={() => runSample("fee")}>
              <Icon name="doc" size={16} />{t("docs.sample")}
            </button>
            <button type="button" className="chip-btn" disabled={busy} onClick={() => runSample("scam")}>
              <Icon name="alert" size={16} />{t("docs.sampleScam")}
            </button>
          </div>

          {error && <div className="banner warn" role="alert"><Icon name="alert" size={18} /><span className="grow">{error}</span></div>}

          {review && (
            <ReviewPanel
              review={review}
              onChange={(i, patch) => setReview((r) => (r ? { ...r, items: r.items.map((it, n) => (n === i ? { ...it, ...patch } : it)) } : r))}
              onRemove={(i) => setReview((r) => (r ? { ...r, items: r.items.filter((_, n) => n !== i) } : r))}
              onAccept={accept}
              onDiscard={() => setReview(null)}
            />
          )}

          <section className="card">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h2 className="disp" style={{ fontSize: 26 }}>{t("docs.yours")}</h2>
              <span className="pill p-idle"><Icon name="lock" size={12} />{t("docs.encrypted")}</span>
            </div>
            <ul>
              {rows.map((d) => (
                <li key={d.id} className="list-row">
                  <span className="file-tile"><Icon name="doc" size={18} /></span>
                  <span className="text">
                    <b>{d.title}</b>
                    <span className="sub mono">{d.file}{d.pages ? ` · ${t("docs.pages", { n: d.pages })}` : ""}</span>
                  </span>
                  <span className="pill p-ok"><Icon name="check" size={12} stroke={3} />{t(d.found === 1 ? "docs.found1" : "docs.found", { n: d.found })}</span>
                  {d.removable && (
                    <button type="button" className="ghost-x" aria-label={`${t("docs.delete")}: ${d.title}`} onClick={() => dispatch({ type: "removeUpload", id: d.id })}>
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <p className="foot">{t("docs.noteSample")}</p>
        </div>

        <aside className="card">
          <span className="eyebrow">{t("docs.how")}</span>
          <ol className="how" style={{ marginTop: 14 }}>
            {([
              ["upload", "docs.h1", "docs.h1d"],
              ["spark", "docs.h2", "docs.h2d"],
              ["check", "docs.h3", "docs.h3d"],
              ["route", "docs.h4", "docs.h4d"],
            ] as const).map(([icon, h, d]) => (
              <li key={h}>
                <span className="icon-tile"><Icon name={icon} size={18} /></span>
                <span style={{ display: "grid", gap: 2 }}><b>{t(h)}</b><p>{t(d)}</p></span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}

function ReviewPanel({
  review, onChange, onRemove, onAccept, onDiscard,
}: {
  review: Review;
  onChange: (i: number, patch: Partial<ExtractedItem>) => void;
  onRemove: (i: number) => void;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  const t = useT();
  const { state } = useApp();
  const [openTerm, setOpenTerm] = useState<string | null>(null);

  useEffect(() => {
    document.getElementById("review-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const blocked = review.showErrors && review.items.some((i) => reviewErrors(i).length);

  return (
    <section className="card review" aria-labelledby="review-title" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <h2 id="review-title" className="disp" style={{ fontSize: 26 }}>{t("docs.review")}</h2>
          <p className="muted" style={{ fontSize: 14 }}>{t("docs.reviewSub", { file: review.result.filename })}</p>
        </div>
        <span className="pill p-ready" style={{ alignSelf: "start" }}>
          <Icon name="spark" size={13} />{review.result.readBy === "gemini" ? t("docs.readByGemini") : t("docs.readBySample")}
        </span>
      </div>

      <ul style={{ display: "grid", gap: 12 }}>
        {review.items.map((item, i) => {
          const errs = review.showErrors ? reviewErrors(item) : [];
          const bad = (k: string) => (errs.includes(k as never) ? " bad" : "");
          const bankIssue = checkBankDetails(item.bank)[0];
          const terms = GLOSSARY_TERMS.filter((g) => (item.source_snippet ?? "").toLowerCase().includes(g.toLowerCase()));
          return (
            <li key={i} className="review-item">
              <div className="review-grid">
                <label className="flabel">{t("docs.fTitle")}
                  <input className={`input${bad("title")}`} value={item.title} onChange={(e) => onChange(i, { title: e.target.value })} />
                </label>
                <label className="flabel">{t("docs.fPayee")}
                  <input className={`input${bad("payee")}`} value={item.payee ?? ""} onChange={(e) => onChange(i, { payee: e.target.value || null })} />
                </label>
                <label className="flabel">{t("docs.fAmount")}
                  <input className={`input num${bad("amount")}`} type="number" min="0" step="0.01" inputMode="decimal" value={item.amount ?? ""}
                    onChange={(e) => onChange(i, { amount: e.target.value === "" ? null : Number(e.target.value) })} />
                </label>
                <label className="flabel">{t("docs.fDue")}
                  <input className={`input${bad("due_date")}`} type="date" value={item.due_date ?? ""} onChange={(e) => onChange(i, { due_date: e.target.value || null })} />
                </label>
                <label className="flabel">{t("docs.fRef")}
                  <input className="input mono" value={item.reference ?? ""} onChange={(e) => onChange(i, { reference: e.target.value || null })} />
                </label>
              </div>
              {item.source_snippet && (
                <div className="src" style={{ background: "var(--surface)" }}>
                  <span className="eyebrow" style={{ display: "flex", gap: 6, alignItems: "center" }}><Icon name="spark" size={14} />{t("flag.from_document")}</span>
                  <p>“{item.source_snippet}”</p>
                  {terms.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {terms.map((term) => (
                        <button key={term} type="button" className="term" aria-expanded={openTerm === `${i}:${term}`} onClick={() => setOpenTerm(openTerm === `${i}:${term}` ? null : `${i}:${term}`)}>
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                  {openTerm?.startsWith(`${i}:`) && <p className="gloss" style={{ fontStyle: "normal" }}>{explain(state.lang, openTerm.slice(String(i).length + 1)).text}</p>}
                </div>
              )}
              {bankIssue && <div className="banner warn" style={{ fontSize: 14 }}><Icon name="alert" size={18} />{t("docs.bankWarning", { msg: bankIssue.message })}</div>}
              {review.items.length > 1 && (
                <button type="button" className="btn ghost sm" style={{ justifySelf: "start" }} onClick={() => onRemove(i)}>
                  <Icon name="x" size={14} />{t("docs.discard")}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {blocked && <p className="err" role="alert">{t("docs.fixFirst")}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="btn dark" onClick={onAccept}>{t("docs.add", { n: review.items.length })}</button>
        <button type="button" className="btn ghost" onClick={onDiscard}>{t("docs.discard")}</button>
      </div>
    </section>
  );
}

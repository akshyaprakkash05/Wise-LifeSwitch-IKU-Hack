"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { PERSON } from "@/lib/demo-data";
import { LANGS } from "@/lib/i18n";
import { DESTINATIONS, ORIGINS, PURPOSES, findCountry } from "@/lib/places";
import type { Lang, Move } from "@/lib/types";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import { MovePreview } from "./MovePreview";

const COURSE_MAX = 60;

export function SetupPage() {
  const { state, dispatch, t, notify } = useApp();
  const router = useRouter();
  const [draft, setDraft] = useState<Move>(state.move);
  const [error, setError] = useState("");
  const errorId = useId();

  // The saved move loads from this browser after the first render; show it once it arrives.
  useEffect(() => setDraft(state.move), [state.move]);

  const from = findCountry(ORIGINS, draft.from);
  const to = findCountry(DESTINATIONS, draft.to);
  const sameCountry = from.name === to.name;
  const changed = JSON.stringify(draft) !== JSON.stringify(state.move);

  function update<K extends keyof Move>(key: K, value: Move[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (sameCountry) {
      setError("Choose a destination that’s different from where you’re moving from.");
      return;
    }
    const move: Move = { ...draft, course: draft.course.trim().slice(0, COURSE_MAX) };
    dispatch({ type: "setMove", move });
    notify(`Plan ready: ${from.city} to ${to.city}. Here’s your money roadmap.`);
    router.push("/");
  }

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="disp">{t("nav_setup")}</h1>
          <p>{t("setupSub")}</p>
        </div>
      </div>

      <div className="row" style={{ alignItems: "stretch" }}>
        <form className="card setup-form" onSubmit={submit} noValidate aria-describedby={error ? errorId : undefined}>
          <div className="setup-grid">
            <label className="flabel" htmlFor="move-from">
              Moving from
              <select id="move-from" className="input" value={draft.from} onChange={(e) => update("from", e.target.value)}>
                {ORIGINS.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.city})</option>
                ))}
              </select>
            </label>
            <label className="flabel" htmlFor="move-to">
              Moving to
              <select
                id="move-to"
                className="input"
                value={draft.to}
                onChange={(e) => update("to", e.target.value)}
                aria-invalid={sameCountry}
              >
                {DESTINATIONS.map((c) => (
                  <option key={c.name} value={c.name}>{c.name} ({c.city})</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="choice-group">
            <legend className="flabel">Why are you moving?</legend>
            <div className="choices">
              {PURPOSES.map((p) => (
                <label key={p.value} className="choice">
                  <input
                    type="radio"
                    name="purpose"
                    value={p.value}
                    checked={draft.purpose === p.value}
                    onChange={() => update("purpose", p.value)}
                  />
                  <span>
                    <b>{p.label}</b>
                    <small>{p.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="setup-grid">
            <label className="flabel" htmlFor="move-lang">
              Language for the app and explanations
              <select
                id="move-lang"
                className="input"
                value={state.lang}
                onChange={(e) => dispatch({ type: "setLang", lang: e.target.value as Lang })}
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </label>
            <label className="flabel" htmlFor="move-course">
              <span>
                {draft.purpose === "Study" ? "Course" : "Job or reason"} <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
              </span>
              <input
                id="move-course"
                className="input"
                value={draft.course}
                maxLength={COURSE_MAX}
                onChange={(e) => update("course", e.target.value)}
                placeholder={draft.purpose === "Study" ? "e.g. Computer Science" : draft.purpose === "Work" ? "e.g. Software engineer" : "e.g. Joining my partner"}
                autoComplete="off"
              />
            </label>
          </div>

          {(error || sameCountry) && (
            <div id={errorId} className="banner warn" role="alert">
              <Icon name="alert" size={18} />
              <span className="grow">{error || "You’ve picked the same country twice. Choose where you’re moving to."}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="submit" className="btn dark" disabled={sameCountry}>
              {t("buildPlan")}
              <Icon name="arrow" size={18} stroke={2.4} />
            </button>
            <span className="muted" style={{ fontSize: 13 }}>
              {changed ? "Your boarding pass updates when you save." : `Saved for ${PERSON.name}. Change anything and save again.`}
            </span>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            Only used to build your plan. Nothing is shared with your Circle unless you choose to.
          </p>
        </form>

        <MovePreview move={draft} />
      </div>
    </>
  );
}

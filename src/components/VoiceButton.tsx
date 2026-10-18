"use client";

import { useEffect, useRef, useState } from "react";
import { PERSON } from "@/lib/demo-data";
import { LANGS } from "@/lib/i18n";
import { daysUntil, needsReference, summarise } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "./Icon";

type Status = "idle" | "loading" | "playing";

/** Reads the roadmap aloud with ElevenLabs, falling back to the browser's voice if ElevenLabs isn't available. */
export function VoiceButton() {
  const { t, items, state, money, notify, itemText, fmt } = useApp();
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCache = useRef(new Map<string, string>());

  useEffect(() => () => stop(), []); // stop audio when leaving the page

  function buildScript(): string {
    const { percent, paidCount, next } = summarise(items, state.paid);
    const parts = [
      t("greet", { name: PERSON.name }),
      t("sorted", { p: percent }),
      t("v_paid", { paid: paidCount, total: items.length }),
    ];
    if (next) {
      const days = daysUntil(next.due);
      parts.push(
        t("v_next", {
          label: t("next"),
          title: itemText(next, "title"),
          amount: money(next.amountGbp),
          date: fmt.longDate(next.due),
          days: days > 0 ? t("v_inDays", { n: days }) : "",
        }),
      );
    }
    const missing = items.find((i) => !state.paid[i.id] && needsReference(i, state.references));
    if (missing) parts.push(t("v_headsUp", { title: lowerFirst(itemText(missing, "title")), payee: missing.payeeShort }));
    return parts.join(" ");
  }

  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setStatus("idle");
  }

  function browserVoice(text: string, reason: string) {
    if (!("speechSynthesis" in window)) {
      notify(t("voiceUnavailable"));
      setStatus("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS.find((l) => l.code === state.lang)?.speech ?? "en-GB";
    u.onend = () => setStatus("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setStatus("playing");
    notify(t("voiceFallback", { reason }));
  }

  async function play() {
    if (status !== "idle") return stop();
    const text = buildScript();
    const cacheKey = `${state.lang}:${text}`;
    setStatus("loading");

    try {
      let url = urlCache.current.get(cacheKey);
      if (!url) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang: state.lang }),
        });
        if (!res.ok) return browserVoice(text, t("voiceNotSet"));
        url = URL.createObjectURL(await res.blob());
        urlCache.current.set(cacheKey, url);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setStatus("idle");
      audio.onerror = () => setStatus("idle");
      await audio.play();
      setStatus("playing");
    } catch {
      browserVoice(text, t("voiceOffline"));
    }
  }

  const label = status === "loading" ? t("preparing") : status === "playing" ? t("stop") : t("listen");

  return (
    <button
      type="button"
      className={`voice-btn ${status}`}
      onClick={play}
      aria-pressed={status === "playing"}
      aria-label={status === "playing" ? t("stopLabel") : t("listenLabel")}
    >
      <span className="voice-ic" aria-hidden="true">
        {status === "loading" ? (
          <span className="spin dark" />
        ) : status === "playing" ? (
          <span className="bars"><i /><i /><i /><i /></span>
        ) : (
          <Icon name="speaker" size={22} stroke={2.2} />
        )}
      </span>
      <span className="voice-text">
        <b>{label}</b>
        {status === "idle" && <small>{t("readAloud")}</small>}
      </span>
    </button>
  );
}

/** "Rent deposit" → "rent deposit" inside a sentence. No effect on scripts without case. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase() + text.slice(1);
}

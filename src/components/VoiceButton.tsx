"use client";

import { useEffect, useRef, useState } from "react";
import { PERSON } from "@/lib/demo-data";
import { LANGS } from "@/lib/i18n";
import { dayAndMonth, daysUntil, needsReference, summarise } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "./Icon";

type Status = "idle" | "loading" | "playing";

/** Reads the roadmap aloud with ElevenLabs, falling back to the browser's voice if ElevenLabs isn't available. */
export function VoiceButton() {
  const { t, items, state, money, notify } = useApp();
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCache = useRef(new Map<string, string>());

  useEffect(() => () => stop(), []); // stop audio when leaving the page

  function buildScript(): string {
    const { percent, paidCount, next } = summarise(items, state.paid);
    const parts = [
      `${t("greet")}, ${PERSON.name}.`,
      t("sorted", { p: percent }),
      `You've paid ${paidCount} of ${items.length} payments.`,
    ];
    if (next) {
      const { day, month } = dayAndMonth(next.due);
      const days = daysUntil(next.due);
      parts.push(`${t("next")}: ${next.title}, ${money(next.amountGbp)}, due ${day} ${month}${days > 0 ? `, in ${days} days` : ""}.`);
    }
    const missing = items.find((i) => !state.paid[i.id] && needsReference(i, state.references));
    if (missing) parts.push(`Heads up: your ${missing.title.toLowerCase()} has no payment reference yet. Ask ${missing.payeeShort} before you pay.`);
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
      notify("Voice isn’t available in this browser.");
      setStatus("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS.find((l) => l.code === state.lang)?.speech ?? "en-GB";
    u.onend = () => setStatus("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setStatus("playing");
    notify(`Using the browser voice: ${reason}.`);
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
        if (!res.ok) {
          const info = (await res.json().catch(() => ({}))) as { message?: string };
          return browserVoice(text, info.message ?? "ElevenLabs isn’t available");
        }
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
      browserVoice(text, "couldn’t reach the voice service");
    }
  }

  const label = status === "loading" ? "Preparing voice…" : status === "playing" ? "Stop" : t("listen");

  return (
    <button
      type="button"
      className={`voice-btn ${status}`}
      onClick={play}
      aria-pressed={status === "playing"}
      aria-label={status === "playing" ? "Stop reading" : "Listen to my roadmap"}
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
        {status === "idle" && <small>Your roadmap, read aloud</small>}
      </span>
    </button>
  );
}

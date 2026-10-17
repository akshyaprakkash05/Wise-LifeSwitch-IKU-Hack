import { NextResponse } from "next/server";
import { LANGS } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

/**
 * Text-to-speech through ElevenLabs.
 * The API key lives only in .env.local on the server and is never sent to the browser.
 * If the key is missing or ElevenLabs refuses, the client falls back to the browser's own voice.
 */

export const runtime = "nodejs";

const MODEL_ID = "eleven_multilingual_v2";
const MAX_CHARS = 700;

// Default voices (overridable in .env.local). Sandi: warm, clear English. Yazhini: native Tamil.
const DEFAULT_VOICE = "enObQy25oEWYDq0r453c";
const DEFAULT_VOICE_TA = "mGboHvCVOXWYeFL8KTR0";

function voiceFor(lang: Lang): string {
  if (lang === "ta") return process.env.ELEVENLABS_VOICE_ID_TA || DEFAULT_VOICE_TA;
  return process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
}

// Cache audio in memory so replaying the same text doesn't spend credits again.
const cache = new Map<string, ArrayBuffer>();

// Simple guard against accidental credit drain: at most 20 new generations per minute.
const recent: number[] = [];
function rateLimited(): boolean {
  const now = Date.now();
  while (recent.length && now - recent[0] > 60_000) recent.shift();
  if (recent.length >= 20) return true;
  recent.push(now);
  return false;
}

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not-configured", message: "ELEVENLABS_API_KEY is not set in .env.local" }, { status: 503 });
  }

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : "";
  const lang = LANGS.some((l) => l.code === body.lang) ? (body.lang as Lang) : "en";
  if (!text) return NextResponse.json({ error: "bad-request", message: "No text to read" }, { status: 400 });

  const voiceId = voiceFor(lang);
  const key = `${voiceId}:${text}`;
  const cached = cache.get(key);
  if (cached) return audioResponse(cached, "hit");

  if (rateLimited()) {
    return NextResponse.json({ error: "rate-limited", message: "Too many voice requests. Try again in a minute." }, { status: 429 });
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      // Pass back the status only, never the key or ElevenLabs' raw error body.
      const reason = res.status === 401 ? "The ElevenLabs key was rejected" : res.status === 404 ? "Voice not found in this ElevenLabs account" : `ElevenLabs returned ${res.status}`;
      console.error(`[tts] ${reason}`);
      return NextResponse.json({ error: "upstream", message: reason }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    if (cache.size > 50) cache.clear();
    cache.set(key, audio);
    return audioResponse(audio, "miss");
  } catch {
    return NextResponse.json({ error: "upstream", message: "Couldn't reach ElevenLabs" }, { status: 502 });
  }
}

function audioResponse(audio: ArrayBuffer, cacheStatus: "hit" | "miss") {
  return new NextResponse(audio, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-TTS-Cache": cacheStatus },
  });
}

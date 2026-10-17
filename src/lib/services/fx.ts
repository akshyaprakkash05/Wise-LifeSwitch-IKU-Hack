import type { CurrencyCode } from "../types";

/**
 * Exchange rates. Server-side only (called from /api/fx).
 * Live rates come from a free public API; if it's down or slow we fall back
 * to approximate rates and say so in the UI (rateSource: "fallback").
 */

export interface FxResult {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  source: "live" | "fallback";
  fetchedAt: string;
}

/** Approximate units per 1 GBP. Only used when the live API is unavailable. */
const FALLBACK_PER_GBP: Record<CurrencyCode, number> = {
  GBP: 1, INR: 114, EUR: 1.17, USD: 1.34, CAD: 1.84, AUD: 2.05,
  NGN: 2050, CNY: 9.6, PKR: 375, BRL: 7.3,
};

export function fallbackRate(from: CurrencyCode, to: CurrencyCode) {
  return FALLBACK_PER_GBP[to] / FALLBACK_PER_GBP[from];
}

export async function getRate(from: CurrencyCode, to: CurrencyCode): Promise<FxResult> {
  const now = new Date().toISOString();
  if (from === to) return { from, to, rate: 1, source: "live", fetchedAt: now };

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) throw new Error(`FX API ${res.status}`);
    const json = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const rate = json.rates?.[to];
    if (json.result !== "success" || typeof rate !== "number") throw new Error("FX API bad payload");
    return { from, to, rate, source: "live", fetchedAt: now };
  } catch (err) {
    console.warn("[fx] using fallback rate:", (err as Error).message);
    return { from, to, rate: fallbackRate(from, to), source: "fallback", fetchedAt: now };
  }
}

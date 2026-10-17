import { NextResponse } from "next/server";
import { SAMPLE_GBP_USD } from "@/lib/money";
import type { FxQuote } from "@/lib/types";

// Cache the live rate for an hour so the demo stays fast.
export const revalidate = 3600;

/**
 * GBP → USD rate. Tries a free public FX source (European Central Bank reference rates via Frankfurter);
 * if it's unreachable, returns a clearly labelled sample rate so the app never breaks mid-demo.
 * In the full build this is replaced by the Wise quote API.
 */
export async function GET() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=GBP&to=USD", {
      next: { revalidate },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`FX source returned ${res.status}`);
    const data = (await res.json()) as { rates?: { USD?: number }; date?: string };
    const rate = data.rates?.USD;
    if (typeof rate !== "number" || !Number.isFinite(rate)) throw new Error("FX source returned no USD rate");
    return NextResponse.json<FxQuote>({ rate, source: "live", asOf: data.date ?? new Date().toISOString().slice(0, 10) });
  } catch {
    return NextResponse.json<FxQuote>({ rate: SAMPLE_GBP_USD, source: "sample", asOf: new Date().toISOString().slice(0, 10) });
  }
}

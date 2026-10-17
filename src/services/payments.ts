import type { Currency, RoadmapItem } from "@/lib/types";
import { convert } from "@/lib/money";

/**
 * The one place LifeSwitch talks to Wise.
 * For the hackathon this is a mock with realistic shapes and latency, so the Wise sandbox
 * (or the real API) can drop in later without touching any UI code.
 * LifeSwitch never moves money itself: it prepares a transfer, and the user confirms it.
 */

export interface TransferQuote {
  itemId: string;
  sourceCurrency: Currency;
  sourceAmount: number;
  fee: number;
  targetCurrency: "GBP";
  targetAmount: number;
  rate: number | null;
  /** True when the rate or fee is a sample, not a live Wise quote. */
  sample: boolean;
}

export interface TransferReceipt {
  id: string;
  status: "sent";
  reference: string;
  createdAt: string;
}

/** Sample fees only. Real fees come from the Wise quote API. */
const SAMPLE_FEE_RATE_USD = 0.0041;
const SAMPLE_FEE_SAME_CURRENCY_GBP = 0.6;

export function prepareTransfer(item: RoadmapItem, from: Currency, usdPerGbp: number): TransferQuote {
  const target = item.amountGbp;
  const fee = from === "USD" ? convert(target, "USD", usdPerGbp) * SAMPLE_FEE_RATE_USD : SAMPLE_FEE_SAME_CURRENCY_GBP;
  const sourceAmount = convert(target, from, usdPerGbp) + fee;
  return {
    itemId: item.id,
    sourceCurrency: from,
    sourceAmount,
    fee,
    targetCurrency: "GBP",
    targetAmount: target,
    rate: from === "USD" ? usdPerGbp : null,
    sample: true, // fees stay samples until the Wise quote API is connected
  };
}

export async function sendTransfer(quote: TransferQuote, reference: string): Promise<TransferReceipt> {
  if (!reference.trim()) throw new Error("A payment reference is required before sending.");
  await new Promise((resolve) => setTimeout(resolve, 900));
  return {
    id: "demo_" + Math.random().toString(36).slice(2, 10),
    status: "sent",
    reference: reference.trim(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sends a transfer through our server, which re-runs the bank detail and Scam Shield checks first
 * (src/app/api/payments/send). Used by the Payments tab. Throws with a readable message if a check fails.
 */
export async function sendCheckedTransfer(item: RoadmapItem, reference: string, confirmRisk: boolean): Promise<TransferReceipt> {
  const res = await fetch("/api/payments/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item, reference, confirmRisk }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `The transfer couldn't be sent (${res.status}). Nothing left your account.`);
  return { id: body.id, status: "sent", reference: body.reference, createdAt: body.createdAt };
}

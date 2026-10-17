import type { CurrencyCode, RoadmapItem, Transfer, TransferQuote } from "../types";

/**
 * Payments service. LifeSwitch only PREPARES transfers; Wise moves the money.
 * For the demo this is mocked. To use the Wise sandbox later, implement
 * `PaymentsService` with real API calls and swap it in `getPaymentsService()`.
 *
 * RULE: never move money without an explicit user confirmation.
 * `createTransfer` only drafts; `confirmTransfer` is the only path to "sent",
 * and the UI must call it from a deliberate Confirm action.
 */
export interface PaymentsService {
  quote(params: {
    sourceCurrency: CurrencyCode;
    targetCurrency: CurrencyCode;
    targetAmount: number;
    rate: number; // target units per 1 source unit
    rateSource: "live" | "fallback";
  }): TransferQuote;
  createTransfer(item: RoadmapItem, quote: TransferQuote): Transfer;
  confirmTransfer(transfer: Transfer): Promise<Transfer>;
}

/** Illustrative fee model for the mock (not Wise's real pricing). */
const FIXED_FEE = 1.2; // in source-currency units, scaled below
const VARIABLE_FEE = 0.0057;

class MockWisePayments implements PaymentsService {
  quote({ sourceCurrency, targetCurrency, targetAmount, rate, rateSource }: Parameters<PaymentsService["quote"]>[0]): TransferQuote {
    const converted = targetAmount / rate; // amount in source currency before fees
    const fixed = FIXED_FEE * (sourceCurrency === "INR" ? 100 : 1);
    const fee = Math.round((fixed + converted * VARIABLE_FEE) * 100) / 100;
    return {
      sourceCurrency,
      targetCurrency,
      targetAmount,
      sourceAmount: Math.round((converted + fee) * 100) / 100,
      rate,
      fee,
      rateSource,
      estimatedDelivery: "Should arrive in seconds",
    };
  }

  createTransfer(item: RoadmapItem, quote: TransferQuote): Transfer {
    return {
      id: `tr_${Math.random().toString(36).slice(2, 10)}`,
      roadmapItemId: item.id,
      payee: item.payee,
      reference: item.reference,
      quote,
      status: "awaiting_confirmation",
      createdAt: new Date().toISOString(),
    };
  }

  async confirmTransfer(transfer: Transfer): Promise<Transfer> {
    if (transfer.status !== "awaiting_confirmation") {
      throw new Error("Only a transfer awaiting confirmation can be sent.");
    }
    await new Promise((r) => setTimeout(r, 900)); // feels like a real network call
    return { ...transfer, status: "sent", confirmedAt: new Date().toISOString() };
  }
}

let instance: PaymentsService | null = null;
export function getPaymentsService(): PaymentsService {
  return (instance ??= new MockWisePayments());
}

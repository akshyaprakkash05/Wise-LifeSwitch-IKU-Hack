import type { Currency } from "./types";

/** Used when the live rate can't be fetched. Always labelled "sample" in the UI. */
export const SAMPLE_GBP_USD = 1.27;

export function convert(amountGbp: number, to: Currency, usdPerGbp: number): number {
  return to === "USD" ? amountGbp * usdPerGbp : amountGbp;
}

export function format(amount: number, currency: Currency, decimals = 0): string {
  const symbol = currency === "USD" ? "$" : "£";
  return (
    symbol +
    amount.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  );
}

/** Format a GBP amount in the user's chosen display currency. */
export function display(amountGbp: number, currency: Currency, usdPerGbp: number, decimals = 0): string {
  return format(convert(amountGbp, currency, usdPerGbp), currency, decimals);
}

/** The same GBP amount in the *other* currency, for the "≈" line. */
export function alternate(amountGbp: number, currency: Currency, usdPerGbp: number, decimals = 0): string {
  return display(amountGbp, currency === "GBP" ? "USD" : "GBP", usdPerGbp, decimals);
}

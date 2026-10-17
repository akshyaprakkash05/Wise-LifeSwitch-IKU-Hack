import type { Country, CurrencyCode } from "./types";

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧" },
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬" },
  { code: "CN", name: "China", currency: "CNY", flag: "🇨🇳" },
  { code: "PK", name: "Pakistan", currency: "PKR", flag: "🇵🇰" },
  { code: "BR", name: "Brazil", currency: "BRL", flag: "🇧🇷" },
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺" },
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪" },
  { code: "IE", name: "Ireland", currency: "EUR", flag: "🇮🇪" },
  { code: "NL", name: "Netherlands", currency: "EUR", flag: "🇳🇱" },
];

export const countryByCode = (code: string) =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

const SYMBOLS: Partial<Record<CurrencyCode, string>> = {
  GBP: "£", INR: "₹", EUR: "€", USD: "$", CAD: "$", AUD: "$",
  NGN: "₦", CNY: "¥", PKR: "₨", BRL: "R$",
};

/** Formats money for display. Large home-currency amounts use the local grouping (e.g. ₹4,52,300). */
export function formatMoney(amount: number, currency: CurrencyCode, opts: { compact?: boolean } = {}) {
  const locale = currency === "INR" ? "en-IN" : "en-GB";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: opts.compact || amount >= 1000 ? 0 : 2,
      notation: opts.compact && amount >= 100000 ? "compact" : "standard",
    }).format(amount);
  } catch {
    return `${SYMBOLS[currency] ?? ""}${Math.round(amount).toLocaleString()}`;
  }
}

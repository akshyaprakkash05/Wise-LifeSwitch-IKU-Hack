import type { Move } from "./types";

export interface Country {
  /** English name, stored in the saved move. Shown translated via `iso`. */
  name: string;
  /** ISO 3166 region code, for the country name in the user's language. */
  iso: string;
  /** Main city used on the boarding pass. */
  city: string;
  /** Airport code shown on the boarding pass. */
  code: string;
  currency: string;
}

export const ORIGINS: Country[] = [
  { name: "India", iso: "IN", city: "Chennai", code: "MAA", currency: "INR" },
  { name: "Nigeria", iso: "NG", city: "Lagos", code: "LOS", currency: "NGN" },
  { name: "China", iso: "CN", city: "Beijing", code: "PEK", currency: "CNY" },
  { name: "United States", iso: "US", city: "New York", code: "JFK", currency: "USD" },
  { name: "Brazil", iso: "BR", city: "São Paulo", code: "GRU", currency: "BRL" },
];

export const DESTINATIONS: Country[] = [
  { name: "United Kingdom", iso: "GB", city: "London", code: "LHR", currency: "GBP" },
  { name: "United States", iso: "US", city: "New York", code: "JFK", currency: "USD" },
  { name: "Canada", iso: "CA", city: "Toronto", code: "YYZ", currency: "CAD" },
  { name: "Germany", iso: "DE", city: "Berlin", code: "BER", currency: "EUR" },
  { name: "Australia", iso: "AU", city: "Sydney", code: "SYD", currency: "AUD" },
];

/** Labels and hints come from the `p_<purpose>` and `ph_<purpose>` message keys. */
export const PURPOSES: Move["purpose"][] = ["Study", "Work", "Family"];

export function findCountry(list: Country[], name: string): Country {
  return list.find((c) => c.name === name) ?? list[0];
}

export const DEFAULT_MOVE: Move = { from: "India", to: "United Kingdom", purpose: "Study", course: "Computer Science" };

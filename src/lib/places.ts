import type { Move } from "./types";

export interface Country {
  name: string;
  /** Main city used on the boarding pass. */
  city: string;
  /** Airport code shown on the boarding pass. */
  code: string;
  currency: string;
}

export const ORIGINS: Country[] = [
  { name: "India", city: "Chennai", code: "MAA", currency: "INR" },
  { name: "Nigeria", city: "Lagos", code: "LOS", currency: "NGN" },
  { name: "China", city: "Beijing", code: "PEK", currency: "CNY" },
  { name: "United States", city: "New York", code: "JFK", currency: "USD" },
  { name: "Brazil", city: "São Paulo", code: "GRU", currency: "BRL" },
];

export const DESTINATIONS: Country[] = [
  { name: "United Kingdom", city: "London", code: "LHR", currency: "GBP" },
  { name: "United States", city: "New York", code: "JFK", currency: "USD" },
  { name: "Canada", city: "Toronto", code: "YYZ", currency: "CAD" },
  { name: "Germany", city: "Berlin", code: "BER", currency: "EUR" },
  { name: "Australia", city: "Sydney", code: "SYD", currency: "AUD" },
];

export const PURPOSES: { value: Move["purpose"]; label: string; hint: string }[] = [
  { value: "Study", label: "Study", hint: "Tuition, deposits, student housing" },
  { value: "Work", label: "Work", hint: "Visa, first rent, setting up pay" },
  { value: "Family", label: "Family", hint: "Visa, housing, sending money home" },
];

export function findCountry(list: Country[], name: string): Country {
  return list.find((c) => c.name === name) ?? list[0];
}

export const DEFAULT_MOVE: Move = { from: "India", to: "United Kingdom", purpose: "Study", course: "Computer Science" };

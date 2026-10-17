/**
 * Shared domain types for Wise LifeSwitch.
 * Every feature imports from here so the pieces fit together.
 * Field names for extracted items match the Gemini JSON contract (snake_case).
 */

export type Purpose = "study" | "work" | "family";
export type LanguageCode = "en" | "ta" | "hi";

export type CurrencyCode =
  | "GBP" | "INR" | "EUR" | "USD" | "CAD" | "AUD" | "NGN" | "CNY" | "PKR" | "BRL";

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: CurrencyCode;
  flag: string;
}

export interface MoveProfile {
  name: string;
  origin: Country;
  destination: Country;
  purpose: Purpose;
  language: LanguageCode;
  /** e.g. "Computer Science" or employer name */
  detail?: string;
  createdAt: string;
}

export type ItemCategory =
  | "tuition" | "housing" | "deposit" | "visa" | "living" | "travel" | "other";

/** Exactly what Gemini returns for each payment found in a document. */
export interface ExtractedItem {
  title: string;
  payee: string;
  amount: number;
  currency: CurrencyCode;
  due_date: string | null; // ISO date (YYYY-MM-DD) or null if not found
  reference: string | null;
  category: ItemCategory;
  requirements: string[];
  explanation: string;
  missing_info: string[];
  source_snippet: string;
}

/** Stored lifecycle of a roadmap item. Display state (due soon / overdue) is derived. */
export type ItemStatus = "todo" | "prepared" | "paid";

export interface RoadmapItem extends ExtractedItem {
  id: string;
  document_id: string | null;
  document_name?: string;
  status: ItemStatus;
  /** true once the user has reviewed the AI extraction */
  reviewed: boolean;
  recurring?: "monthly" | null;
  /** true for app-generated estimates (e.g. living costs) rather than document facts */
  estimate?: boolean;
  paid_at?: string | null;
}

export type DisplayState = "paid" | "overdue" | "due_soon" | "upcoming" | "no_date";

/* ---------- Payments (Wise, mocked behind a service) ---------- */

export type TransferStatus = "draft" | "awaiting_confirmation" | "sent" | "failed";

export interface TransferQuote {
  sourceCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  targetAmount: number;
  sourceAmount: number;
  rate: number;
  fee: number; // in source currency
  rateSource: "live" | "fallback";
  estimatedDelivery: string;
}

export interface Transfer {
  id: string;
  roadmapItemId: string;
  payee: string;
  reference: string | null;
  quote: TransferQuote;
  status: TransferStatus;
  createdAt: string;
  confirmedAt?: string;
}

/* ---------- Circle ---------- */

export interface CircleMember {
  id: string;
  name: string;
  relation: string;
  initials: string;
  sharing: boolean; // opt-in activity sharing
}

export interface Activity {
  id: string;
  memberId: string;
  text: string;
  at: string;
  kind: "payment" | "milestone" | "checkin";
}

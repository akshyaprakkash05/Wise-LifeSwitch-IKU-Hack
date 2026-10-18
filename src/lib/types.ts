import type { MessageKey } from "./messages/en";

export type Lang = "en" | "ta" | "hi" | "es" | "fr" | "zh";
export type Currency = "GBP" | "USD";

export type DocKind = "offer" | "tenancy" | "invoice";

/** Bank details found on a document. Used by Scam Shield; only the last digits are ever shown. */
export interface BankDetails {
  account_name?: string | null;
  iban?: string | null;
  bic?: string | null;
  sort_code?: string | null;
  account_number?: string | null;
}

/** A payee the student already trusts, used to spot changed bank details. */
export interface KnownPayee {
  name: string;
  account_fingerprint: string;
}

/** One payment the AI found in a relocation document. Amounts are stored in GBP (the payee's currency). */
export interface RoadmapItem {
  id: string;
  /** English title, used for the voice cache and as a fallback. UI text comes from the `title_<id>` message key. */
  title: string;
  payee: string;
  payeeShort: string;
  /** Last digits of the payee's account, for display only. */
  account: string;
  amountGbp: number;
  /** Due date, ISO yyyy-mm-dd. Shown in the user's language via Intl. */
  due: string;
  doc: DocKind;
  /** Payment reference from the document. Empty when the AI could not find one. */
  reference: string;
  /** The exact sentence the AI extracted this payment from. Kept in the document's own language. */
  sourceSnippet: string;
  /** Unfamiliar terms the user can tap for a plain explanation. */
  terms: string[];
  category: "Tuition" | "Housing";
  /** A Wise transfer is already prepared. */
  ready?: boolean;
  recurring?: boolean;
  /** The document had a problem the user must resolve before paying. */
  flag?: "missing-reference";
  /** Full bank details from the document (for Scam Shield). */
  bank?: BankDetails;
  /** Full text of the document or message, so Scam Shield can read the wording. */
  sourceText?: string;
  /** Set on items added from an uploaded document: the upload's id. */
  uploadId?: string;
}

export type StatusKey = "done" | "warn" | "up";

export interface ItemStatus {
  key: StatusKey;
  label: MessageKey;
  pill: "p-ok" | "p-warn" | "p-ready" | "p-idle";
  dot: "ok" | "warn" | "ready" | "";
}

export interface FeedEntry {
  /** A message key for "You"/"Mum", or a person's name as written. */
  who: MessageKey | string;
  text: MessageKey;
  /** Hours before the demo's "today". 0 means just now. */
  hoursAgo: number;
  family: boolean;
}

export interface FxQuote {
  /** USD per 1 GBP. */
  rate: number;
  source: "live" | "sample";
  asOf: string;
}

/** The move the user set up: where from, where to, why. */
export interface Move {
  from: string;
  to: string;
  purpose: "Study" | "Work" | "Family";
  /** Course or job, optional. */
  course: string;
}

export type Lang = "en" | "ta" | "hi" | "es" | "fr" | "zh";
export type Currency = "GBP" | "USD";

export type DocKind = "offer" | "tenancy" | "invoice";

/** One payment the AI found in a relocation document. Amounts are stored in GBP (the payee's currency). */
export interface RoadmapItem {
  id: string;
  title: string;
  payee: string;
  payeeShort: string;
  /** Last digits of the payee's account, for display only. */
  account: string;
  amountGbp: number;
  /** Due date, ISO yyyy-mm-dd. */
  due: string;
  /** How the due date reads in full, e.g. "1 September 2026, then monthly". */
  dueLabel: string;
  doc: DocKind;
  /** Payment reference from the document. Empty when the AI could not find one. */
  reference: string;
  repeat: string;
  /** One-line context under the title. */
  note: string;
  /** The exact sentence the AI extracted this payment from. */
  sourceSnippet: string;
  /** Unfamiliar terms the user can tap for a plain explanation. */
  terms: string[];
  category: "Tuition" | "Housing";
  /** A Wise transfer is already prepared. */
  ready?: boolean;
  recurring?: boolean;
  /** The document had a problem the user must resolve before paying. */
  flag?: "missing-reference";
}

export type StatusKey = "done" | "warn" | "up";

export interface ItemStatus {
  key: StatusKey;
  label: string;
  pill: "p-ok" | "p-warn" | "p-ready" | "p-idle";
  dot: "ok" | "warn" | "ready" | "";
}

export interface FeedEntry {
  who: string;
  text: string;
  time: string;
  family: boolean;
}

export interface FxQuote {
  /** USD per 1 GBP. */
  rate: number;
  source: "live" | "sample";
  asOf: string;
}

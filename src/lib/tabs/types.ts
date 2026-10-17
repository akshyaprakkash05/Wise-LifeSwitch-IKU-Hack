// Types for the Documents, Payments and Reminders tabs.

import type { BankDetails } from "@/lib/types";

/** A document the student uploaded (or a built-in sample) after they checked what the AI found. */
export interface Upload {
  id: string;
  title: string;
  file: string;
  pages: number | null;
  found: number;
  readBy: "sample" | "gemini";
}

/** A reminder the student added by hand (phone plan, travelcard...). Amount in GBP. */
export interface CustomReminder {
  id: string;
  title: string;
  amountGbp: number;
  when: string;
  repeats: "once" | "weekly" | "monthly";
  enabled: boolean;
}

export type PaymentKind = "tuition" | "rent" | "deposit" | "fee" | "other";

/** One payment pulled out of a document, before the student has checked it. */
export interface ExtractedItem {
  title: string;
  payee: string | null;
  amount: number | null;
  currency: string | null;
  due_date: string | null;
  reference: string | null;
  kind: PaymentKind;
  source_snippet: string | null;
  bank: BankDetails | null;
}

export interface ExtractionResult {
  documentTitle: string;
  filename: string;
  pages: number | null;
  readBy: "sample" | "gemini";
  fullText: string;
  items: ExtractedItem[];
}

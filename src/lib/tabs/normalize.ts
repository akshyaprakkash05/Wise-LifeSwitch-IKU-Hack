// Cleans up what the AI returns before anything reaches the student.
// AI output is never trusted directly: wrong types and impossible values become null and get flagged.

import type { BankDetails } from "@/lib/types";
import type { ExtractedItem, PaymentKind } from "./types";
import { isValidIsoDate } from "./dates";

const KINDS: PaymentKind[] = ["tuition", "rent", "deposit", "fee", "other"];

const str = (v: unknown, max = 300): string | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).trim().slice(0, max);
  return s || null;
};

function amount(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^0-9.\-]/g, "")) : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > 10_000_000) return null;
  return Math.round(n * 100) / 100;
}

function bank(v: unknown): BankDetails | null {
  if (!v || typeof v !== "object") return null;
  const b = v as Record<string, unknown>;
  const out: BankDetails = {
    account_name: str(b.account_name, 120),
    iban: str(b.iban, 40),
    bic: str(b.bic, 15),
    sort_code: str(b.sort_code, 12),
    account_number: str(b.account_number, 20),
  };
  return Object.values(out).some(Boolean) ? out : null;
}

export function normalizeItem(raw: unknown): ExtractedItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title, 120);
  const amt = amount(r.amount);
  if (!title && amt === null) return null;
  const currency = str(r.currency, 10)?.toUpperCase() ?? null;
  const due = str(r.due_date, 10);
  const kind = str(r.kind ?? r.category, 20)?.toLowerCase() as PaymentKind | undefined;
  return {
    title: title ?? "Payment",
    payee: str(r.payee, 120),
    amount: amt,
    currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : null,
    due_date: isValidIsoDate(due) ? due : null,
    reference: str(r.reference, 60),
    kind: kind && KINDS.includes(kind) ? kind : "other",
    source_snippet: str(r.source_snippet, 500),
    bank: bank(r.bank),
  };
}

export function normalizeItems(raw: unknown): ExtractedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeItem).filter((x): x is ExtractedItem => x !== null).slice(0, 20);
}

/** Problems that must be fixed on the review screen before an item joins the roadmap. */
export function reviewErrors(item: Pick<ExtractedItem, "title" | "amount" | "due_date" | "payee">): ("title" | "amount" | "due_date" | "payee")[] {
  const errs: ("title" | "amount" | "due_date" | "payee")[] = [];
  if (!item.title?.trim()) errs.push("title");
  if (!item.payee?.trim()) errs.push("payee");
  if (item.amount === null || !(item.amount > 0)) errs.push("amount");
  if (!isValidIsoDate(item.due_date)) errs.push("due_date");
  return errs;
}

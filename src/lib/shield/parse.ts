// Pulls payment details out of a pasted message with plain patterns (no AI).
// Used when Gemini isn't available, and to double-check what Gemini returns.

import type { BankDetails } from "@/lib/types";

export interface ReadMessage {
  payee: string | null;
  amount: number | null;
  currency: string | null;
  bank: BankDetails;
  fullText: string;
  readBy: "gemini" | "patterns";
}

const first = (re: RegExp, text: string) => re.exec(text)?.[1]?.trim() ?? null;

export function parseMessage(text: string): ReadMessage {
  const iban = first(/\b([A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?)\b/, text);
  const bic = first(/\b(?:BIC|SWIFT)(?:\s*code)?\s*[:\-]?\s*([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/i, text);
  const sort = first(/sort\s*code\s*[:\-]?\s*(\d{2}[\s\-]?\d{2}[\s\-]?\d{2})/i, text);
  const account = first(/account\s*(?:number|no\.?)\s*[:\-]?\s*(\d[\d\s]{5,10}\d)/i, text);
  const accountName = first(/account\s*name\s*[:\-]?\s*([^\n,]{2,60})/i, text);
  const money = /(£|€|\$|GBP|EUR|USD|INR|₹)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i.exec(text);
  const symbols: Record<string, string> = { "£": "GBP", "€": "EUR", $: "USD", "₹": "INR" };
  const fromLine = first(/(?:this is|from)\s+([A-Z][\w&' ]{2,50}?)(?:[.,\n]| here)/, text);

  return {
    payee: accountName ?? fromLine,
    amount: money ? Number(money[2].replace(/,/g, "")) : null,
    currency: money ? symbols[money[1]] ?? money[1].toUpperCase() : null,
    bank: {
      account_name: accountName,
      iban: iban ? iban.replace(/\s/g, "") : null,
      bic: bic ? bic.toUpperCase() : null,
      sort_code: sort,
      account_number: account ? account.replace(/\s/g, "") : null,
    },
    fullText: text,
    readBy: "patterns",
  };
}

// Built-in samples for the Documents tab and the seed data for Reminders. All fictional.

import { DOCS, NORTHFIELD_BANK, UNIVERSITY_BANK } from "@/lib/demo-data";
import type { KnownPayee } from "@/lib/types";
import type { CustomReminder, ExtractionResult } from "./types";

/** Accounts Tara already trusts (from her offer letter and tenancy). Scam Shield compares against these. */
export const KNOWN_PAYEES: KnownPayee[] = [
  { name: NORTHFIELD_BANK.account_name, account_fingerprint: `UK:${NORTHFIELD_BANK.sort_code.replace(/\D/g, "")}:${NORTHFIELD_BANK.account_number}` },
  { name: UNIVERSITY_BANK.account_name, account_fingerprint: `UK:${UNIVERSITY_BANK.sort_code.replace(/\D/g, "")}:${UNIVERSITY_BANK.account_number}` },
];

export const SEED_CUSTOM_REMINDERS: CustomReminder[] = [
  { id: "phone", title: "Phone plan", amountGbp: 10, when: "5th of each month", repeats: "monthly", enabled: true },
  { id: "travelcard", title: "Travelcard top-up", amountGbp: 25, when: "Every Monday", repeats: "weekly", enabled: false },
];

const FEE_INVOICE_TEXT = `University fees office - Fee invoice 2026-27
Student: Tara S. Student number: STU-2026-48213
Tuition fee, instalment 1 of 2: £8,250.00, due 30 September 2026.
Lab and materials fee: £120.00, due 15 September 2026.
Pay by bank transfer to University fees office, sort code 40-11-60, account number 31929025.
Quote your student number as the payment reference.`;

export const SAMPLE_FEE_INVOICE: ExtractionResult = {
  documentTitle: "Fee invoice",
  filename: DOCS.invoice.file,
  pages: 2,
  readBy: "sample",
  fullText: FEE_INVOICE_TEXT,
  items: [
    {
      title: "Tuition instalment 1", payee: "University fees office", amount: 8250, currency: "GBP", due_date: "2026-09-30",
      reference: "STU-2026-48213", kind: "tuition", source_snippet: "Tuition fee, instalment 1 of 2: £8,250.00, due 30 September 2026.", bank: UNIVERSITY_BANK,
    },
    {
      title: "Lab and materials fee", payee: "University fees office", amount: 120, currency: "GBP", due_date: "2026-09-15",
      reference: "STU-2026-48213", kind: "fee", source_snippet: "Lab and materials fee: £120.00, due 15 September 2026.", bank: UNIVERSITY_BANK,
    },
  ],
};

const SCAM_TEXT = `Hi Tara, this is Northfield Student Living. Our bank details have changed. Please pay your £1,150 deposit URGENTLY today to our new account or you will lose the room.
Account name: Northfield Student Living
Sort code: 60-83-71
Account number: 29384756
Please don't call the office, we are very busy. Just send a screenshot once paid.`;

export const SAMPLE_SCAM_MESSAGE: ExtractionResult = {
  documentTitle: "Message: new bank details",
  filename: "WhatsApp_Screenshot.png",
  pages: 1,
  readBy: "sample",
  fullText: SCAM_TEXT,
  items: [
    {
      title: "Rent deposit (new details)", payee: "Northfield Student Living", amount: 1150, currency: "GBP", due_date: "2026-07-28",
      reference: "NSL-DEP-14B", kind: "deposit",
      source_snippet: "Our bank details have changed. Please pay your £1,150 deposit URGENTLY today to our new account or you will lose the room.",
      bank: { account_name: "Northfield Student Living", sort_code: "60-83-71", account_number: "29384756" },
    },
  ],
};

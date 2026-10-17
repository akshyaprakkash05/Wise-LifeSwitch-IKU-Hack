import type { DocKind, FeedEntry, RoadmapItem } from "./types";

/**
 * Seeded demo account: Tara, moving from Chennai to London to study Computer Science.
 * In the full build these items come from Gemini reading the user's real documents.
 */
export const DEMO_TODAY = "2026-07-28";

export const PERSON = {
  name: "Tara",
  fullName: "Tara S.",
} as const;

export const DOCS: Record<DocKind, { name: string; file: string }> = {
  offer: { name: "Offer letter", file: "Offer_Letter_Tara_S.pdf" },
  tenancy: { name: "Tenancy agreement", file: "Northfield_Tenancy_14B.pdf" },
  invoice: { name: "Fee invoice", file: "Fee_Invoice_2026-27.pdf" },
};

/** Bank details from Tara's documents (fictional). Scam Shield compares new requests against these. */
export const NORTHFIELD_BANK = { account_name: "Northfield Student Living", sort_code: "20-32-06", account_number: "53014471" };
export const UNIVERSITY_BANK = { account_name: "University fees office", sort_code: "40-11-60", account_number: "31929025" };

export const ROADMAP: RoadmapItem[] = [
  {
    id: "hold",
    title: "Room holding fee",
    payee: "Northfield Student Living",
    payeeShort: "Northfield",
    account: "•• 4471",
    bank: NORTHFIELD_BANK,
    amountGbp: 200,
    due: "2026-07-12",
    dueLabel: "12 July 2026",
    doc: "tenancy",
    reference: "NSL-HOLD-2207",
    repeat: "One-off",
    note: "From tenancy agreement",
    sourceSnippet: "A holding fee of £200 is payable to reserve the room and will be deducted from the first rent payment.",
    terms: ["holding fee"],
    category: "Housing",
  },
  {
    id: "tuition",
    title: "Tuition deposit",
    payee: "University fees office",
    payeeShort: "University",
    account: "•• 9025",
    bank: UNIVERSITY_BANK,
    amountGbp: 5000,
    due: "2026-08-01",
    dueLabel: "1 August 2026",
    doc: "offer",
    reference: "STU-2026-48213",
    repeat: "One-off",
    note: "From offer letter · transfer prepared",
    sourceSnippet:
      "A tuition deposit of £5,000 must be received by 1 August 2026 to confirm your place. Your CAS will be issued once payment is received.",
    terms: ["deposit", "CAS"],
    category: "Tuition",
    ready: true,
  },
  {
    id: "rent-dep",
    title: "Rent deposit",
    payee: "Northfield Student Living",
    payeeShort: "Northfield",
    account: "•• 4471",
    bank: NORTHFIELD_BANK,
    amountGbp: 1150,
    due: "2026-08-15",
    dueLabel: "15 August 2026",
    doc: "tenancy",
    reference: "",
    repeat: "One-off",
    note: "From tenancy agreement · guarantor needed",
    sourceSnippet:
      "A security deposit of £1,150 is due before move-in. The tenant shall provide a UK-based guarantor or pay six months’ rent in advance.",
    terms: ["guarantor", "payment reference"],
    category: "Housing",
    flag: "missing-reference",
  },
  {
    id: "rent1",
    title: "First month’s rent",
    payee: "Northfield Student Living",
    payeeShort: "Northfield",
    account: "•• 4471",
    bank: NORTHFIELD_BANK,
    amountGbp: 950,
    due: "2026-09-01",
    dueLabel: "1 September 2026, then monthly",
    doc: "tenancy",
    reference: "NSL-14B-TARA",
    repeat: "Monthly, on the 1st",
    note: "Recurring · reminder 3 days before",
    sourceSnippet: "Rent of £950 per calendar month is payable in advance on the 1st day of each month.",
    terms: ["standing order"],
    category: "Housing",
    recurring: true,
  },
];

/** Payments already made before the demo starts. */
export const INITIAL_PAID: Record<string, boolean> = { hold: true };

/** First-term budget in GBP. Living costs are an estimate for September to November. */
export const BUDGET = { tuition: 9500, housing: 2300, living: 3300 };

export const CIRCLE_FEED: FeedEntry[] = [
  { who: "You", text: "set a reminder for rent on the 1st", time: "2h", family: false },
  { who: "Mum", text: "reacted to your rent reminder", time: "2h", family: true },
  { who: "Ravi", text: "joined your Circle", time: "Mon", family: true },
];

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

/** Document file names. Display names come from the `docName_<kind>` message keys. */
export const DOCS: Record<DocKind, { file: string }> = {
  offer: { file: "Offer_Letter_Tara_S.pdf" },
  tenancy: { file: "Northfield_Tenancy_14B.pdf" },
  invoice: { file: "Fee_Invoice_2026-27.pdf" },
};

export const ROADMAP: RoadmapItem[] = [
  {
    id: "hold",
    title: "Room holding fee",
    payee: "Northfield Student Living",
    payeeShort: "Northfield",
    account: "•• 4471",
    amountGbp: 200,
    due: "2026-07-12",
    doc: "tenancy",
    reference: "NSL-HOLD-2207",
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
    amountGbp: 5000,
    due: "2026-08-01",
    doc: "offer",
    reference: "STU-2026-48213",
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
    amountGbp: 1150,
    due: "2026-08-15",
    doc: "tenancy",
    reference: "",
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
    amountGbp: 950,
    due: "2026-09-01",
    doc: "tenancy",
    reference: "NSL-14B-TARA",
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
  { who: "you", text: "feedReminder", hoursAgo: 2, family: false },
  { who: "mum", text: "feedReacted", hoursAgo: 2, family: true },
  { who: "Ravi", text: "feedJoined", hoursAgo: 30, family: true },
];

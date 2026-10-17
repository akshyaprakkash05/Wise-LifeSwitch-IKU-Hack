import type { Activity, CircleMember, ManualReminder, MoveProfile, RoadmapItem } from "../types";
import { countryByCode } from "../countries";

/**
 * Seeded demo account: Priya, 19, Chennai (INR) → London (GBP), Computer Science.
 * Dates are relative to today so countdowns always look live on stage.
 * Institutions and companies here are fictional.
 */

const iso = (daysFromNow: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
};

export const PRIYA_PROFILE: MoveProfile = {
  name: "Priya",
  origin: countryByCode("IN"),
  destination: countryByCode("GB"),
  purpose: "study",
  language: "en",
  detail: "BSc Computer Science",
  createdAt: new Date().toISOString(),
};

export function priyaRoadmap(): RoadmapItem[] {
  return [
    {
      id: "visa-fee",
      document_id: "cas",
      document_name: "CAS statement.pdf",
      title: "Student visa application fee",
      payee: "UK Visas and Immigration",
      amount: 524,
      currency: "GBP",
      due_date: iso(-21),
      reference: "GWF078812345",
      category: "visa",
      requirements: ["Valid CAS number", "Passport"],
      explanation: "The government fee to apply for your Student visa. It's paid online when you submit the application.",
      missing_info: [],
      source_snippet: "Visa application fee: £524 (payable on application)",
      status: "paid",
      reviewed: true,
      paid_at: iso(-21),
    },
    {
      id: "tuition-deposit",
      document_id: "offer",
      document_name: "Offer letter.pdf",
      title: "Tuition deposit",
      payee: "Kingsbridge University London",
      amount: 4000,
      currency: "GBP",
      due_date: iso(6),
      reference: "KUL-2027-118842",
      category: "tuition",
      requirements: ["Quote your student ID as the payment reference", "Pay from an account in your or your sponsor's name"],
      explanation: "A deposit that secures your place. It's taken off your first year's tuition, so it isn't an extra cost.",
      missing_info: [],
      source_snippet: "A non-refundable tuition deposit of £4,000 must be received by the University within 14 days of accepting this offer, quoting reference KUL-2027-118842.",
      status: "todo",
      reviewed: true,
    },
    {
      id: "rent-deposit",
      document_id: "tenancy",
      document_name: "Tenancy agreement.pdf",
      title: "Tenancy deposit (5 weeks' rent)",
      payee: "Camden Gate Lettings Ltd",
      amount: 1125,
      currency: "GBP",
      due_date: iso(13),
      reference: null,
      category: "deposit",
      requirements: ["UK-based guarantor, or 6 months' rent paid upfront", "Signed tenancy agreement"],
      explanation: "A refundable deposit the landlord must protect in a government-approved scheme. You get it back when you move out, minus any damage.",
      missing_info: ["No payment reference found. Ask the letting agent what to quote so your payment is matched to your room."],
      source_snippet: "The Tenant shall pay a deposit of £1,125.00 prior to the start of the Tenancy. A Guarantor resident in the UK is required.",
      status: "todo",
      reviewed: true,
    },
    {
      id: "first-rent",
      document_id: "tenancy",
      document_name: "Tenancy agreement.pdf",
      title: "First month's rent",
      payee: "Camden Gate Lettings Ltd",
      amount: 975,
      currency: "GBP",
      due_date: iso(27),
      reference: "CGL-FLAT4B",
      category: "housing",
      requirements: ["Paid monthly in advance on the 1st"],
      explanation: "Rent is paid a month in advance. After this, a reminder repeats every month.",
      missing_info: [],
      source_snippet: "Rent of £975.00 per calendar month payable in advance on the first day of each month. Reference: CGL-FLAT4B",
      status: "todo",
      reviewed: true,
      recurring: "monthly",
    },
    {
      id: "tuition-balance",
      document_id: "invoice",
      document_name: "Fee invoice.pdf",
      title: "Tuition, first instalment",
      payee: "Kingsbridge University London",
      amount: 8750,
      currency: "GBP",
      due_date: iso(48),
      reference: "KUL-2027-118842",
      category: "tuition",
      requirements: ["Deposit already deducted", "Second instalment due in January"],
      explanation: "Half of your remaining tuition. The university splits the fee into two instalments so you don't pay it all at once.",
      missing_info: [],
      source_snippet: "Instalment 1 of 2: £8,750.00 due at enrolment. Instalment 2 of 2: £8,750.00 due 15 January.",
      status: "todo",
      reviewed: true,
    },
    {
      id: "living",
      document_id: null,
      title: "Living costs (monthly estimate)",
      payee: "Day-to-day spending",
      amount: 1300,
      currency: "GBP",
      due_date: null,
      reference: null,
      category: "living",
      requirements: [],
      explanation: "An estimate for food, travel, phone and bills in London, excluding rent. Adjust it once you know your own spending.",
      missing_info: [],
      source_snippet: "",
      status: "todo",
      reviewed: true,
      recurring: "monthly",
      estimate: true,
    },
  ];
}

export const PRIYA_CIRCLE: CircleMember[] = [
  { id: "priya", name: "Priya", relation: "You", initials: "P", sharing: true },
  { id: "amma", name: "Amma", relation: "Mum", initials: "A", sharing: true },
  { id: "appa", name: "Appa", relation: "Dad", initials: "R", sharing: true },
];

export const PRIYA_ACTIVITY: Activity[] = [
  { id: "a1", memberId: "priya", text: "Paid the visa fee", at: new Date(Date.now() - 21 * 864e5).toISOString(), kind: "payment" },
  { id: "a2", memberId: "amma", text: "Joined Priya's Circle", at: new Date(Date.now() - 3 * 864e5).toISOString(), kind: "milestone" },
];

export const PRIYA_REMINDERS = (): ManualReminder[] => [
  { id: "r-phone", title: "Phone plan (Wise eSIM)", amount: 10, currency: "GBP", due_date: iso(2), recurring: "monthly" },
  { id: "r-gym", title: "Student gym membership", amount: 18, currency: "GBP", due_date: iso(19), recurring: "monthly" },
];

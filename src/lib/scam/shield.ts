// Scam Shield: decides how risky a payment request looks and explains why.
// Rule-based on purpose, so every warning can be explained to the student and to the judges.

import type { BankDetails, KnownPayee } from "@/lib/types";
import { accountFingerprint, checkBankDetails, type BankIssue } from "./bank";

export type RiskLevel = "low" | "medium" | "high";

export interface ScamSignal {
  code: string;
  points: number;
  title: string;
  detail: string;
}

export interface ScamReport {
  level: RiskLevel;
  score: number;
  signals: ScamSignal[];
  bankIssues: BankIssue[];
  advice: string;
  /** True when the student must tick "I've checked" before paying. */
  needsConfirmation: boolean;
  /** True when the bank details are wrong or missing, so the payment can't go ahead until they're fixed. */
  detailsInvalid: boolean;
}

interface LanguageRule {
  code: string;
  pattern: RegExp;
  points: number;
  title: string;
  detail: string;
}

const LANGUAGE_RULES: LanguageRule[] = [
  {
    code: "changed_details",
    pattern: /\b(new|changed|updated|different)\s+(bank|account|banking)(\s+(details|account|info))?\b|\bbank (details|account) (have|has) (changed|been updated)\b/i,
    points: 35,
    title: "Says the bank details have changed",
    detail: "Messages announcing new bank details are one of the most common ways payment scams start.",
  },
  {
    code: "pressure",
    pattern: /\b(urgent|urgently|immediately|asap|right now|within (the|an) hour|today only|by (the )?end of (the )?day|final notice|last chance|or (you('ll)?|you will) lose (the|your) (room|flat|place|offer))\b/i,
    points: 20,
    title: "Pressure to pay fast",
    detail: "Scammers rush you so you don't stop to check.",
  },
  {
    code: "secrecy",
    pattern: /\b(don'?t tell|do not tell|keep (this|it) (between us|private|quiet|secret)|don'?t call|do not call|no need to call)\b/i,
    points: 30,
    title: "Asks you to keep it quiet or not call",
    detail: "A real landlord or university won't mind you calling them on a number you already have.",
  },
  {
    code: "untraceable_payment",
    pattern: /\b(gift ?cards?|itunes|steam card|google play card|amazon voucher|bitcoin|btc|crypto|usdt|western union|cash only)\b/i,
    points: 40,
    title: "Asks for gift cards, crypto or cash",
    detail: "Rent, deposits and fees are never paid in gift cards or crypto.",
  },
  {
    code: "too_good",
    pattern: /\b(can'?t (do|arrange) (a )?viewing|no viewing|i('m| am) (abroad|overseas|out of the country)|send (the )?deposit (first|before)|keys (will be )?(sent|posted))\b/i,
    points: 30,
    title: "No viewing, deposit first",
    detail: "Fake landlords often say they're abroad and ask for a deposit before you can see the flat.",
  },
  {
    code: "money_mule",
    pattern: /\b(receive (money|funds|a payment) (into|in) your account|let (money|funds) pass through|keep \d+ ?%|easy money|quick cash|send it (back|on) to)\b/i,
    points: 50,
    title: "Asks you to move money for someone else",
    detail: "Letting money pass through your account is money laundering, even if you keep only a small cut. It can lead to a criminal record and your bank account being closed.",
  },
  {
    code: "fake_authority",
    pattern: /\b(visa|immigration|home office|hmrc|police)\b[^.\n]{0,80}\b(fee|fine|penalty|pay|payment)\b/i,
    points: 30,
    title: "Claims to be the Home Office, HMRC or police asking for money",
    detail: "Government bodies don't ask for urgent payments by phone, text or message. Check on gov.uk directly.",
  },
];

const nameKey = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(ltd|limited|llc|inc|plc|co|company|the)\b/g, " ")
    .split(/\s+/).filter(Boolean).join(" ");

/** What Scam Shield needs to know about a payment. */
export interface ScamInput {
  payee: string | null;
  bank?: BankDetails | null;
  /** Full text of the document or message the payment came from. */
  source_text?: string | null;
  source_snippet?: string | null;
  amount?: number | null;
  currency?: string | null;
}

export function assessPayment(item: ScamInput, knownPayees: KnownPayee[] = []): ScamReport {
  const signals: ScamSignal[] = [];
  const text = `${item.source_text ?? ""}\n${item.source_snippet ?? ""}`;

  for (const rule of LANGUAGE_RULES) {
    if (rule.pattern.test(text)) {
      signals.push({ code: rule.code, points: rule.points, title: rule.title, detail: rule.detail });
    }
  }

  const fingerprint = accountFingerprint(item.bank);
  const payeeName = item.bank?.account_name || item.payee;
  const sameName = knownPayees.filter((p) => nameKey(p.name) === nameKey(payeeName) && nameKey(payeeName) !== "");

  // Strongest signal: a payee you already know, but a different account.
  if (fingerprint && sameName.length && sameName.every((p) => p.account_fingerprint !== fingerprint)) {
    signals.push({
      code: "account_changed",
      points: 50,
      title: `Different bank account from the one saved for ${sameName[0].name}`,
      detail: "Contact them using a phone number or email you already had, not one from this message, before paying.",
    });
  }

  // This account is saved under someone else's name.
  if (fingerprint) {
    const other = knownPayees.find((p) => p.account_fingerprint === fingerprint && nameKey(p.name) !== nameKey(payeeName));
    if (other && payeeName) {
      signals.push({
        code: "name_mismatch",
        points: 25,
        title: "This account belongs to someone else you've paid",
        detail: `You've saved this account as "${other.name}", not "${payeeName}".`,
      });
    }
  }

  const bankIssues = checkBankDetails(item.bank);
  if (bankIssues.some((i) => i.code.startsWith("iban") || i.code === "account_number_format" || i.code === "sort_code_format")) {
    signals.push({
      code: "invalid_bank_details",
      points: 20,
      title: "Bank details don't pass basic checks",
      detail: "The details have a mistake in them. It could be a typo, but don't pay until they're correct.",
    });
  }

  const score = Math.min(100, signals.reduce((s, x) => s + x.points, 0));
  const level: RiskLevel = score >= 50 ? "high" : score >= 20 ? "medium" : "low";
  const known = !!fingerprint && knownPayees.some((p) => p.account_fingerprint === fingerprint && nameKey(p.name) === nameKey(payeeName));

  const advice =
    level === "high" ? "Stop and check before paying. Contact the person or company using details you already trust, not ones from this message."
    : level === "medium" ? "This might be fine, but take a minute to check the details match what you expected."
    : known ? "You've paid this account before."
    : "No warning signs found.";

  return { level, score, signals, bankIssues, advice, needsConfirmation: level === "high", detailsInvalid: bankIssues.length > 0 };
}

/** Where each warning phrase sits in the text, so the Scam Shield page can highlight it. */
export function riskyPhrases(text: string): { start: number; end: number; code: string; title: string }[] {
  const found: { start: number; end: number; code: string; title: string }[] = [];
  for (const rule of LANGUAGE_RULES) {
    const global = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");
    for (const m of text.matchAll(global)) {
      if (m.index === undefined || !m[0]) continue;
      found.push({ start: m.index, end: m.index + m[0].length, code: rule.code, title: rule.title });
    }
  }
  // Keep the earliest of any overlapping matches.
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  return found.filter((f, i) => i === 0 || f.start >= found[i - 1].end);
}


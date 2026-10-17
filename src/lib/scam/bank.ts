// Scam Shield: bank detail checks. Plain deterministic code, no AI.

import type { BankDetails } from "@/lib/types";

/** IBAN total length per country (ISO 13616 registry, common countries). */
const IBAN_LENGTHS: Record<string, number> = {
  AE: 23, AT: 20, BE: 16, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18, EE: 20, ES: 24,
  FI: 18, FR: 27, GB: 22, GR: 27, HR: 21, HU: 28, IE: 22, IT: 27, LT: 20, LU: 20,
  LV: 21, MT: 31, NL: 18, NO: 15, PL: 28, PT: 25, RO: 24, SA: 24, SE: 24, SI: 19, SK: 24, TR: 26,
};

export type BankIssueCode =
  | "iban_format" | "iban_length" | "iban_checksum"
  | "bic_format" | "bic_country"
  | "sort_code_format" | "account_number_format"
  | "missing_details";

export interface BankIssue {
  code: BankIssueCode;
  field: keyof BankDetails;
  message: string;
  fix: string;
}

export const compact = (s: string | null | undefined): string =>
  (s ?? "").replace(/[\s\-.]/g, "").toUpperCase();

/** ISO 7064 mod-97 check used by every IBAN. */
export function ibanChecksumOk(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = parseInt(ch, 36);
    if (Number.isNaN(value)) return false;
    for (const digit of String(value)) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

export function checkBankDetails(bank: BankDetails | null | undefined): BankIssue[] {
  const issues: BankIssue[] = [];
  if (!bank) return issues;

  const iban = compact(bank.iban);
  const bic = compact(bank.bic);
  const sortCode = (bank.sort_code ?? "").replace(/\D/g, "");
  const account = (bank.account_number ?? "").replace(/\s/g, "");

  if (iban) {
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
      issues.push({ code: "iban_format", field: "iban", message: "This doesn't look like an IBAN.", fix: "An IBAN starts with 2 letters and 2 numbers, like GB82…" });
    } else {
      const expected = IBAN_LENGTHS[iban.slice(0, 2)];
      if (expected && iban.length !== expected) {
        issues.push({ code: "iban_length", field: "iban", message: `A ${iban.slice(0, 2)} IBAN should be ${expected} characters, this one has ${iban.length}.`, fix: "Check for a missing or extra character on the original document." });
      } else if (!ibanChecksumOk(iban)) {
        issues.push({ code: "iban_checksum", field: "iban", message: "The IBAN's built-in check failed, so at least one character is wrong.", fix: "Compare it character by character with the original. Don't pay until it matches." });
      }
    }
  }

  if (bic) {
    const m = /^[A-Z]{4}([A-Z]{2})[A-Z0-9]{2}([A-Z0-9]{3})?$/.exec(bic);
    if (!m) {
      issues.push({ code: "bic_format", field: "bic", message: "The BIC/SWIFT code should be 8 or 11 characters.", fix: "Check it on the original document." });
    } else if (iban && /^[A-Z]{2}/.test(iban) && m[1] !== iban.slice(0, 2)) {
      issues.push({ code: "bic_country", field: "bic", message: `The BIC is for country ${m[1]} but the IBAN is from ${iban.slice(0, 2)}.`, fix: "These normally match. Ask the recipient to confirm." });
    }
  }

  if (bank.sort_code && sortCode.length !== 6) {
    issues.push({ code: "sort_code_format", field: "sort_code", message: "UK sort codes are 6 digits.", fix: "It should look like 12-34-56." });
  }
  if (bank.account_number && sortCode && !/^\d{8}$/.test(account)) {
    issues.push({ code: "account_number_format", field: "account_number", message: "UK account numbers are 8 digits.", fix: "Check for a missing or extra digit." });
  }

  if (!iban && !(sortCode && account)) {
    issues.push({ code: "missing_details", field: "iban", message: "There aren't enough bank details to make this payment.", fix: "You need an IBAN, or a UK sort code and account number." });
  }
  return issues;
}

/** One string that identifies the destination account, so we can compare against saved payees. */
export function accountFingerprint(bank: BankDetails | null | undefined): string | null {
  if (!bank) return null;
  const iban = compact(bank.iban);
  if (iban) return `IBAN:${iban}`;
  const sortCode = (bank.sort_code ?? "").replace(/\D/g, "");
  const account = (bank.account_number ?? "").replace(/\s/g, "");
  if (sortCode && account) return `UK:${sortCode}:${account}`;
  return null;
}

/** Show only the last 4 characters, e.g. for read-aloud and history. */
export function maskAccount(value: string | null | undefined): string {
  const v = compact(value);
  if (!v) return "";
  return v.length <= 4 ? v : `ending ${v.slice(-4)}`;
}

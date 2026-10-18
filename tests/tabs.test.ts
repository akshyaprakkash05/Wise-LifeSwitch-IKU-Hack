import { describe, expect, it } from "vitest";
import { ROADMAP } from "@/lib/demo-data";
import { checkBankDetails, ibanChecksumOk } from "@/lib/scam/bank";
import { assessPayment } from "@/lib/scam/shield";
import { toRoadmapItems } from "@/lib/tabs/convert";
import { normalizeItem, normalizeItems, reviewErrors } from "@/lib/tabs/normalize";
import { nextDue, reminderRows, validateReminder } from "@/lib/tabs/reminders";
import { KNOWN_PAYEES, SAMPLE_FEE_INVOICE, SAMPLE_SCAM_MESSAGE, SEED_CUSTOM_REMINDERS } from "@/lib/tabs/samples";
import { TABS_EN, TABS_HI, TABS_TA, tt } from "@/lib/tabs/strings";

const scamInput = (i: (typeof ROADMAP)[number]) => ({ payee: i.payee, bank: i.bank, source_text: i.sourceText, source_snippet: i.sourceSnippet, amount: i.amountGbp, currency: "GBP" });

describe("Scam Shield", () => {
  it("catches IBAN typos", () => {
    expect(ibanChecksumOk("GB82WEST12345698765432")).toBe(true);
    expect(ibanChecksumOk("GB82WEST12345698765431")).toBe(false);
  });
  it("every seeded payment has valid bank details and is low risk", () => {
    for (const i of ROADMAP) {
      expect(checkBankDetails(i.bank)).toEqual([]);
      expect(assessPayment(scamInput(i), KNOWN_PAYEES).level).toBe("low");
    }
  });
  it("flags the 'new bank details' message as high risk", () => {
    const [item] = toRoadmapItems(SAMPLE_SCAM_MESSAGE.items, "u1", SAMPLE_SCAM_MESSAGE.fullText);
    const r = assessPayment(scamInput(item), KNOWN_PAYEES);
    expect(r.level).toBe("high");
    expect(r.signals.map((s) => s.code)).toEqual(expect.arrayContaining(["account_changed", "changed_details", "pressure", "secrecy"]));
  });
});

describe("Documents", () => {
  it("never trusts impossible AI values", () => {
    const item = normalizeItem({ title: "Rent", payee: "X", amount: "-5", currency: "pounds", due_date: "31/08/2026" })!;
    expect(item).toMatchObject({ amount: null, currency: null, due_date: null });
    expect(reviewErrors(item)).toEqual(["amount", "due_date"]);
    expect(normalizeItems("junk")).toEqual([]);
  });
  it("turns the sample invoice into roadmap items the rest of the app understands", () => {
    const items = toRoadmapItems(SAMPLE_FEE_INVOICE.items, "u1", SAMPLE_FEE_INVOICE.fullText);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: "u1-0", payeeShort: "University", account: "•• 9025", amountGbp: 8250, due: "2026-09-30", ready: true });
  });
  it("marks items without a reference as needing one", () => {
    const [item] = toRoadmapItems([{ ...SAMPLE_FEE_INVOICE.items[0], reference: null }], "u2", "");
    expect(item.flag).toBe("missing-reference");
  });
});

describe("Reminders", () => {
  it("lists unpaid roadmap payments first, then the student's own", () => {
    const rows = reminderRows(ROADMAP, { hold: true }, {}, SEED_CUSTOM_REMINDERS);
    expect(rows.map((r) => r.title)).toEqual(["Tuition deposit", "Rent deposit", "Rent", "Phone plan", "Travelcard top-up"]);
    expect(rows.find((r) => r.title === "Rent")?.when).toBe("1st of each month");
  });
  it("the demo reminder fires for the soonest unpaid payment that is switched on", () => {
    expect(nextDue(ROADMAP, { hold: true }, {})?.item.id).toBe("tuition");
    expect(nextDue(ROADMAP, { hold: true }, { tuition: true })?.item.id).toBe("rent-dep");
    expect(nextDue(ROADMAP, { hold: true, tuition: true }, {})?.days).toBe(18);
  });
  it("validates the form", () => {
    expect(validateReminder({ title: "", amount: "0", repeats: "once", when: "" })).toEqual({ title: true, amount: true, when: true });
    expect(validateReminder({ title: "Gym", amount: "25", repeats: "monthly", when: "10th" })).toEqual({});
  });
});

describe("Translations", () => {
  it("Tamil and Hindi cover every key and keep placeholders", () => {
    for (const dict of [TABS_TA, TABS_HI]) {
      expect(Object.keys(dict).sort()).toEqual(Object.keys(TABS_EN).sort());
      for (const [k, en] of Object.entries(TABS_EN)) {
        const want = (en.match(/\{\w+\}/g) ?? []).sort();
        expect((dict[k as keyof typeof TABS_EN].match(/\{\w+\}/g) ?? []).sort(), k).toEqual(want);
      }
    }
  });
  it("falls back to English for other languages", () => {
    expect(tt("fr", "pay.title")).toBe("Payments");
    expect(tt("ta", "pay.title")).not.toBe("Payments");
  });
});

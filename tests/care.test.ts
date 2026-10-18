import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, SEED_SPENDING, assessSpend, normalizeSettings, type CareSettings, type Spend } from "@/lib/care/rules";
import { CARE_EN, careT } from "@/lib/care/strings";

const spend = (category: Spend["category"], amountGbp: number): Spend => ({ id: "x", merchant: "Shop", category, amountGbp });

describe("Care Card rules", () => {
  it("matches the mock-up with the default settings", () => {
    const statuses = SEED_SPENDING.map((s) => assessSpend(s, DEFAULT_SETTINGS).status);
    expect(statuses).toEqual(["approved", "approved", "alert", "alert", "alert"]);
  });

  it("only watches cash withdrawals above £50", () => {
    expect(assessSpend(spend("cash", 30), DEFAULT_SETTINGS)).toEqual({ status: "approved" });
    expect(assessSpend(spend("cash", 80), DEFAULT_SETTINGS)).toEqual({ status: "alert", reason: "cash" });
  });

  it("lets essentials through above the daily limit, but flags other spending", () => {
    expect(assessSpend(spend("groceries", 150), DEFAULT_SETTINGS).status).toBe("approved");
    const offMarket: CareSettings = { ...DEFAULT_SETTINGS, watch: { ...DEFAULT_SETTINGS.watch, marketplace: false } };
    expect(assessSpend(spend("marketplace", 95), offMarket)).toEqual({ status: "alert", reason: "limit" });
    expect(assessSpend(spend("marketplace", 40), offMarket).status).toBe("approved");
  });

  it("pauses instead of alerting in Block mode, and switching a shop off stops its alerts", () => {
    const block: CareSettings = { ...DEFAULT_SETTINGS, mode: "block" };
    expect(assessSpend(spend("gambling", 5), block)).toEqual({ status: "paused", reason: "gambling" });
    const noGambling: CareSettings = { ...DEFAULT_SETTINGS, watch: { ...DEFAULT_SETTINGS.watch, gambling: false } };
    expect(assessSpend(spend("gambling", 5), noGambling).status).toBe("approved");
  });

  it("cleans up bad saved settings", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    const s = normalizeSettings({ dailyLimit: 9999, mode: "nonsense", watch: { gambling: "yes", cash: false } });
    expect(s.dailyLimit).toBe(200);
    expect(s.mode).toBe("alert");
    expect(s.watch).toEqual({ gambling: true, marketplace: false, cash: false, phone: true });
  });

  it("has text for every key and falls back to English", () => {
    for (const lang of ["en", "ta", "hi", "es", "fr", "zh"] as const) {
      for (const key of Object.keys(CARE_EN) as (keyof typeof CARE_EN)[]) {
        expect(careT(lang, key, { amount: "£50", shop: "x", what: "x", merchant: "x" })).not.toMatch(/\{\w+\}/);
      }
    }
    expect(careT("ta", "cardName")).toBe("Care Card");
  });
});

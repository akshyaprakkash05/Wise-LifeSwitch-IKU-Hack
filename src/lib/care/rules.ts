// Care Card rules (Sadana). Plain code, no AI: every alert can be explained by one rule.

export type ShopKind = "gambling" | "marketplace" | "cash" | "phone";
export type Category = "groceries" | "pharmacy" | "transport" | "gambling" | "marketplace" | "cash" | "phone";
export type Mode = "alert" | "block";

export interface CareSettings {
  /** Daily limit in GBP. Above it the card still works for essentials, and the carer gets an alert. */
  dailyLimit: number;
  mode: Mode;
  watch: Record<ShopKind, boolean>;
}

export interface Spend {
  id: string;
  merchant: string;
  category: Category;
  amountGbp: number;
}

export type Verdict =
  | { status: "approved" }
  | { status: "alert" | "paused"; reason: ShopKind | "limit" };

export const LIMIT_MIN = 20;
export const LIMIT_MAX = 200;
export const LIMIT_STEP = 10;
/** Cash withdrawals above this are watched when "cash" is switched on. */
export const CASH_WATCH_OVER = 50;

/** Groceries, pharmacy and transport always go through, even above the daily limit. */
export const ESSENTIALS: Category[] = ["groceries", "pharmacy", "transport"];

export const DEFAULT_SETTINGS: CareSettings = {
  dailyLimit: 60,
  mode: "alert",
  watch: { gambling: true, marketplace: false, cash: true, phone: true },
};

/** Joseph's recent card payments (fictional, newest first). */
export const SEED_SPENDING: Spend[] = [
  { id: "s1", merchant: "Co-op Hornchurch", category: "groceries", amountGbp: 8.4 },
  { id: "s2", merchant: "Boots", category: "pharmacy", amountGbp: 12.1 },
  { id: "s3", merchant: "SpinWin Casino", category: "gambling", amountGbp: 40 },
  { id: "s4", merchant: "HomeSafe Phone Sales", category: "phone", amountGbp: 249 },
  { id: "s5", merchant: "ATM Romford", category: "cash", amountGbp: 80 },
];

/** Payments the "Try a card payment" button adds, one after another. */
export const TEST_PAYMENTS: Omit<Spend, "id">[] = [
  { merchant: "QuickWin Lottery", category: "gambling", amountGbp: 25 },
  { merchant: "Tesco Express", category: "groceries", amountGbp: 14.75 },
  { merchant: "MarketHub Online", category: "marketplace", amountGbp: 95 },
  { merchant: "ATM Hornchurch", category: "cash", amountGbp: 30 },
  { merchant: "Doorstep Roofing Ltd", category: "phone", amountGbp: 450 },
];

function watchedKind(spend: Spend): ShopKind | null {
  switch (spend.category) {
    case "gambling":
    case "marketplace":
    case "phone":
      return spend.category;
    case "cash":
      return spend.amountGbp > CASH_WATCH_OVER ? "cash" : null;
    default:
      return null;
  }
}

/** What happens to one payment under the current settings. */
export function assessSpend(spend: Spend, settings: CareSettings): Verdict {
  const flagged = settings.mode === "block" ? "paused" : "alert";
  const kind = watchedKind(spend);
  if (kind && settings.watch[kind]) return { status: flagged, reason: kind };
  if (!ESSENTIALS.includes(spend.category) && spend.amountGbp > settings.dailyLimit) {
    return { status: flagged, reason: "limit" };
  }
  return { status: "approved" };
}

/** Clean up settings read back from browser storage. */
export function normalizeSettings(raw: unknown): CareSettings {
  const r = (raw ?? {}) as Partial<CareSettings>;
  const limit = Number(r.dailyLimit);
  const watch = (r.watch ?? {}) as Partial<Record<ShopKind, unknown>>;
  return {
    dailyLimit: Number.isFinite(limit)
      ? Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, Math.round(limit / LIMIT_STEP) * LIMIT_STEP))
      : DEFAULT_SETTINGS.dailyLimit,
    mode: r.mode === "block" ? "block" : "alert",
    watch: {
      gambling: typeof watch.gambling === "boolean" ? watch.gambling : DEFAULT_SETTINGS.watch.gambling,
      marketplace: typeof watch.marketplace === "boolean" ? watch.marketplace : DEFAULT_SETTINGS.watch.marketplace,
      cash: typeof watch.cash === "boolean" ? watch.cash : DEFAULT_SETTINGS.watch.cash,
      phone: typeof watch.phone === "boolean" ? watch.phone : DEFAULT_SETTINGS.watch.phone,
    },
  };
}

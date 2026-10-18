"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { DEMO_TODAY, INITIAL_PAID, ROADMAP } from "@/lib/demo-data";
import { countryName, dayAndMonth, formatLongDate, formatShortDate, isMessageKey, translate, type MessageKey } from "@/lib/i18n";
import { SAMPLE_GBP_USD, alternate, display } from "@/lib/money";
import { DEFAULT_MOVE, DESTINATIONS, ORIGINS, findCountry, type Country } from "@/lib/places";
import type { Currency, FxQuote, Lang, Move, RoadmapItem } from "@/lib/types";
import { SEED_CUSTOM_REMINDERS } from "@/lib/tabs/samples";
import type { CustomReminder, Upload } from "@/lib/tabs/types";
import type { ChatLine } from "@/lib/circle/demo";

interface State {
  lang: Lang;
  currency: Currency;
  paid: Record<string, boolean>;
  /** References the user typed in for items whose document had none. */
  references: Record<string, string>;
  selectedId: string;
  openTerm: string | null;
  reminderBanner: boolean;
  payItemId: string | null;
  reminderOpen: boolean;
  toast: string;
  fx: FxQuote;
  move: Move;
  /** Payments added from documents the student uploaded on the Documents tab. */
  extraItems: RoadmapItem[];
  uploads: Upload[];
  /** Reminders for roadmap items the student switched off. */
  reminderOff: Record<string, boolean>;
  customReminders: CustomReminder[];
  /** What the student lets their Circle see. Each is opt-in and can be paused. */
  circleShare: CircleShare;
  /** Messages typed into the sample Circle's chat this visit (the real Circle keeps its own in Postgres). */
  circleChat: ChatLine[];
}

export type CircleShareKey = "payments" | "arrival" | "reminders" | "location";
export type CircleShare = Record<CircleShareKey, boolean>;

type Action =
  | { type: "hydrate"; saved: Partial<State> }
  | { type: "setLang"; lang: Lang }
  | { type: "setCurrency"; currency: Currency }
  | { type: "select"; id: string; term?: string | null }
  | { type: "toggleTerm"; term: string }
  | { type: "hideBanner" }
  | { type: "openPay"; id: string }
  | { type: "closePay" }
  | { type: "markPaid"; id: string; reference: string }
  | { type: "setReminder"; open: boolean }
  | { type: "toast"; message: string }
  | { type: "setFx"; fx: FxQuote }
  | { type: "setMove"; move: Move }
  | { type: "addUpload"; upload: Upload; items: RoadmapItem[] }
  | { type: "removeUpload"; id: string }
  | { type: "setReference"; id: string; reference: string }
  | { type: "toggleItemReminder"; id: string }
  | { type: "addCustomReminder"; reminder: CustomReminder }
  | { type: "toggleCustomReminder"; id: string }
  | { type: "removeCustomReminder"; id: string }
  | { type: "setCircleShare"; key: CircleShareKey; on: boolean }
  | { type: "addCircleChat"; line: ChatLine }
  | { type: "reset" };

const initialState: State = {
  lang: "en",
  currency: "GBP",
  paid: { ...INITIAL_PAID },
  references: {},
  selectedId: "tuition",
  openTerm: null,
  reminderBanner: true,
  payItemId: null,
  reminderOpen: false,
  toast: "",
  fx: { rate: SAMPLE_GBP_USD, source: "sample", asOf: "" },
  move: DEFAULT_MOVE,
  extraItems: [],
  uploads: [],
  reminderOff: {},
  customReminders: SEED_CUSTOM_REMINDERS,
  circleShare: { payments: true, arrival: true, reminders: false, location: true },
  circleChat: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.saved };
    case "setLang":
      return { ...state, lang: action.lang };
    case "setCurrency":
      return { ...state, currency: action.currency };
    case "select":
      return { ...state, selectedId: action.id, openTerm: action.term ?? null };
    case "toggleTerm":
      return { ...state, openTerm: state.openTerm === action.term ? null : action.term };
    case "hideBanner":
      return { ...state, reminderBanner: false };
    case "openPay":
      return { ...state, payItemId: action.id, reminderOpen: false, selectedId: action.id };
    case "closePay":
      return { ...state, payItemId: null };
    case "markPaid":
      return {
        ...state,
        paid: { ...state.paid, [action.id]: true },
        references: action.reference ? { ...state.references, [action.id]: action.reference } : state.references,
      };
    case "setReminder":
      return { ...state, reminderOpen: action.open };
    case "toast":
      return { ...state, toast: action.message };
    case "setFx":
      return { ...state, fx: action.fx };
    case "setMove":
      return { ...state, move: action.move };
    case "addUpload":
      return { ...state, uploads: [action.upload, ...state.uploads], extraItems: [...state.extraItems, ...action.items] };
    case "removeUpload":
      // The payments it added stay in the plan; only the document is deleted.
      return { ...state, uploads: state.uploads.filter((u) => u.id !== action.id) };
    case "setReference":
      return { ...state, references: { ...state.references, [action.id]: action.reference } };
    case "toggleItemReminder":
      return { ...state, reminderOff: { ...state.reminderOff, [action.id]: !state.reminderOff[action.id] } };
    case "addCustomReminder":
      return { ...state, customReminders: [...state.customReminders, action.reminder] };
    case "toggleCustomReminder":
      return { ...state, customReminders: state.customReminders.map((r) => (r.id === action.id ? { ...r, enabled: !r.enabled } : r)) };
    case "removeCustomReminder":
      return { ...state, customReminders: state.customReminders.filter((r) => r.id !== action.id) };
    case "setCircleShare":
      return { ...state, circleShare: { ...state.circleShare, [action.key]: action.on } };
    case "addCircleChat":
      return { ...state, circleChat: [...state.circleChat, action.line] };
    case "reset":
      return { ...initialState, fx: state.fx, lang: state.lang, currency: state.currency };
  }
}

const STORAGE_KEY = "lifeswitch-demo-v1";
type Saved = Pick<
  State,
  "lang" | "currency" | "paid" | "references" | "reminderBanner" | "move" | "extraItems" | "uploads" | "reminderOff" | "customReminders" | "circleShare"
>;

interface AppContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  items: RoadmapItem[];
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** An item's title or one-line note in the chosen language. */
  itemText: (item: RoadmapItem, field: "title" | "note") => string;
  /** Dates, country names and "2 hours ago" in the chosen language. */
  fmt: {
    longDate: (isoDate: string) => string;
    shortDate: (isoDate: string) => string;
    dayMonth: (isoDate: string) => { day: string; month: string };
    country: (c: Country) => string;
    ago: (hoursAgo: number) => string;
  };
  /** Amount in the chosen display currency. */
  money: (amountGbp: number, decimals?: number) => string;
  /** Same amount in the other currency, for the "≈" line. */
  moneyAlt: (amountGbp: number, decimals?: number) => string;
  notify: (message: string) => void;
  /** The move resolved to cities and airport codes, for the boarding pass and top bar. */
  trip: { from: Country; to: Country; purpose: Move["purpose"]; course: string };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Restore the demo from this browser after the first render (keeps server and client HTML identical).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", saved: JSON.parse(raw) as Partial<Saved> });
    } catch {
      /* storage unavailable: start fresh */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const saved: Saved = {
      lang: state.lang,
      currency: state.currency,
      paid: state.paid,
      references: state.references,
      reminderBanner: state.reminderBanner,
      move: state.move,
      extraItems: state.extraItems,
      uploads: state.uploads,
      reminderOff: state.reminderOff,
      customReminders: state.customReminders,
      circleShare: state.circleShare,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [
    state.lang, state.currency, state.paid, state.references, state.reminderBanner, state.move,
    state.extraItems, state.uploads, state.reminderOff, state.customReminders, state.circleShare,
  ]);

  // Live GBP→USD rate from our API route (falls back to a labelled sample).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/fx")
      .then((r) => (r.ok ? (r.json() as Promise<FxQuote>) : null))
      .then((fx) => {
        if (fx && !cancelled) dispatch({ type: "setFx", fx });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  const notify = useCallback((message: string) => {
    dispatch({ type: "toast", message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: "toast", message: "" }), 3600);
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const rate = state.fx.rate;
    const lang = state.lang;
    const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
    return {
      state,
      dispatch,
      items: state.extraItems.length ? [...ROADMAP, ...state.extraItems] : ROADMAP,
      t,
      itemText: (item, field) => {
        const key = `${field}_${item.id}`;
        if (isMessageKey(key)) return t(key);
        // Items added from an uploaded document have no fixed translation.
        return field === "title" ? item.title : t("foundIn", { doc: t(`doc_${item.doc}`) });
      },
      fmt: {
        longDate: (iso) => formatLongDate(lang, iso),
        shortDate: (iso) => formatShortDate(lang, iso),
        dayMonth: (iso) => dayAndMonth(lang, iso),
        country: (c) => countryName(lang, c.iso, c.name),
        ago: (hours) => relativeTime(lang, hours, t),
      },
      money: (gbp, decimals = 0) => display(gbp, state.currency, rate, decimals),
      moneyAlt: (gbp, decimals = 0) => alternate(gbp, state.currency, rate, decimals),
      notify,
      trip: {
        from: findCountry(ORIGINS, state.move.from),
        to: findCountry(DESTINATIONS, state.move.to),
        purpose: state.move.purpose,
        course: state.move.course,
      },
    };
  }, [state, notify]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function relativeTime(lang: Lang, hoursAgo: number, t: AppContextValue["t"]): string {
  if (hoursAgo <= 0) return t("justNow");
  if (hoursAgo < 24) return new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "narrow" }).format(-hoursAgo, "hour");
  const when = new Date(Date.parse(DEMO_TODAY + "T12:00:00Z") - hoursAgo * 3_600_000);
  return new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" }).format(when);
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppStateProvider>");
  return ctx;
}

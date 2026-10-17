import type { LanguageCode } from "./types";

/**
 * Minimal i18n. Language switch (Sadana) owns expanding this:
 * add keys here and read them with `t(lang, "key")`.
 * Missing translations fall back to English, so nothing ever renders blank.
 */

const en = {
  "nav.home": "Roadmap",
  "nav.upload": "Upload",
  "nav.pay": "Pay",
  "nav.circle": "Circle",
  "nav.more": "More",
};

type Key = keyof typeof en;

const dict: Record<LanguageCode, Partial<Record<Key, string>>> = {
  en,
  ta: {
    "nav.home": "திட்டம்",
    "nav.upload": "பதிவேற்று",
    "nav.pay": "செலுத்து",
    "nav.circle": "குடும்பம்",
    "nav.more": "மேலும்",
  },
  hi: {
    "nav.home": "योजना",
    "nav.upload": "अपलोड",
    "nav.pay": "भुगतान",
    "nav.circle": "परिवार",
    "nav.more": "और",
  },
};

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

export function t(lang: LanguageCode | undefined, key: Key): string {
  return dict[lang ?? "en"][key] ?? en[key];
}

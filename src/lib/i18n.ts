import type { Lang } from "./types";
import { en, type MessageKey, type Messages } from "./messages/en";
import { es } from "./messages/es";
import { fr } from "./messages/fr";
import { hi } from "./messages/hi";
import { ta } from "./messages/ta";
import { zh } from "./messages/zh";

export type { MessageKey };

export const LANGS: { code: Lang; label: string; speech: string }[] = [
  { code: "en", label: "English", speech: "en-GB" },
  { code: "ta", label: "தமிழ் (Tamil)", speech: "ta-IN" },
  { code: "hi", label: "हिन्दी (Hindi)", speech: "hi-IN" },
  { code: "es", label: "Español", speech: "es-ES" },
  { code: "fr", label: "Français", speech: "fr-FR" },
  { code: "zh", label: "中文 (Chinese)", speech: "zh-CN" },
];

/** Every language provides every key: the `Messages` type makes a missing string a build error. */
const MESSAGES: Record<Lang, Messages> = { en, ta, hi, es, fr, zh };

/** Locale used for dates and country names in each language. */
const LOCALE: Record<Lang, string> = {
  en: "en-GB",
  ta: "ta-IN",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  zh: "zh-CN",
};

export function isMessageKey(key: string): key is MessageKey {
  return key in en;
}

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  let text = MESSAGES[lang][key] || en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

function toDate(isoDate: string): Date {
  return new Date(isoDate + "T00:00:00Z");
}

/** "1 September 2026" in English, "2026年9月1日" in Chinese, and so on. */
export function formatLongDate(lang: Lang, isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    toDate(isoDate),
  );
}

/** "1 Sep" style, for compact labels. */
export function formatShortDate(lang: Lang, isoDate: string): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", timeZone: "UTC" }).format(toDate(isoDate));
}

/** Day number and short month name, for the timeline date tiles. */
export function dayAndMonth(lang: Lang, isoDate: string): { day: string; month: string } {
  const d = toDate(isoDate);
  const month = new Intl.DateTimeFormat(LOCALE[lang], { month: "short", timeZone: "UTC" }).format(d).replace(/\.$/, "");
  return { day: String(d.getUTCDate()), month };
}

/** Country name in the chosen language, from its ISO region code. */
export function countryName(lang: Lang, iso: string, fallback: string): string {
  try {
    return new Intl.DisplayNames([LOCALE[lang]], { type: "region" }).of(iso) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Plain-language explanations of terms found in documents. Falls back to English when a translation is missing. */
const GLOSSARY: Record<Lang, Record<string, string>> = {
  en: {
    deposit: "Money paid upfront to secure your place. It comes off your total tuition fee, so it is not an extra cost.",
    CAS: "Confirmation of Acceptance for Studies. A reference your university issues for your student visa application, usually once your deposit is paid.",
    "holding fee": "A small payment that reserves a room while the tenancy is agreed. It usually counts towards your rent or deposit.",
    guarantor: "Someone who agrees to pay your rent if you can’t. Many UK landlords ask for a UK-based guarantor. No guarantor? Some accept a guarantor service or rent paid in advance.",
    "payment reference": "A code you add to a transfer so the receiver knows who paid. Without it, your payment can be delayed or lost.",
    "standing order": "A regular payment of the same amount on the same date. LifeSwitch reminds you a few days before, and you choose when to pay.",
  },
  ta: {
    guarantor: "உங்களால் வாடகை செலுத்த முடியாவிட்டால், அதைச் செலுத்துவதாக ஒப்புக்கொள்ளும் நபர். பல UK வீட்டு உரிமையாளர்கள் UK-யில் வசிக்கும் ஒருவரைக் கேட்பார்கள்.",
    "payment reference": "யார் பணம் அனுப்பினார் என்று பெறுபவருக்குத் தெரிய, பரிமாற்றத்தில் சேர்க்கும் குறியீடு. இது இல்லையெனில் உங்கள் பணம் தாமதமாகலாம்.",
    CAS: "Confirmation of Acceptance for Studies. மாணவர் விசா விண்ணப்பத்திற்காக உங்கள் பல்கலைக்கழகம் வழங்கும் குறிப்பு எண்.",
    deposit: "உங்கள் இடத்தை உறுதிசெய்ய முன்கூட்டியே செலுத்தும் பணம். இது மொத்தக் கட்டணத்திலிருந்து கழிக்கப்படும்.",
  },
  hi: {
    guarantor: "वह व्यक्ति जो वादा करता है कि अगर आप किराया नहीं दे पाए तो वह देगा। कई UK मकान मालिक UK में रहने वाला गारंटर माँगते हैं।",
    "payment reference": "ट्रांसफ़र के साथ जोड़ा जाने वाला कोड, ताकि पाने वाले को पता चले कि भुगतान किसने किया। इसके बिना भुगतान अटक सकता है।",
    CAS: "Confirmation of Acceptance for Studies. स्टूडेंट वीज़ा आवेदन के लिए आपकी यूनिवर्सिटी द्वारा दिया गया रेफ़रेंस नंबर।",
    deposit: "आपकी सीट पक्की करने के लिए पहले से दी गई रकम। यह आपकी कुल फ़ीस में से घटा दी जाती है।",
  },
  es: {
    guarantor: "Una persona que se compromete a pagar tu alquiler si tú no puedes. Muchos caseros del Reino Unido piden un avalista que viva allí.",
    "payment reference": "Un código que añades a la transferencia para que el destinatario sepa quién pagó. Sin él, tu pago puede retrasarse.",
    CAS: "Confirmation of Acceptance for Studies. Un número de referencia que da tu universidad para solicitar el visado de estudiante.",
    deposit: "Dinero que pagas por adelantado para asegurar tu plaza. Se descuenta de la matrícula total.",
  },
  fr: {
    guarantor: "Une personne qui s’engage à payer votre loyer si vous ne pouvez pas. Beaucoup de propriétaires britanniques demandent un garant résidant au Royaume-Uni.",
    "payment reference": "Un code ajouté au virement pour que le destinataire sache qui a payé. Sans lui, votre paiement peut être retardé.",
    CAS: "Confirmation of Acceptance for Studies. Un numéro de référence fourni par votre université pour la demande de visa étudiant.",
    deposit: "Une somme versée à l’avance pour réserver votre place. Elle est déduite des frais de scolarité totaux.",
  },
  zh: {
    guarantor: "如果你无法支付房租，承诺替你支付的人。许多英国房东要求担保人住在英国。",
    "payment reference": "转账时附上的编码，让收款方知道是谁付的款。没有它，款项可能会延误。",
    CAS: "录取确认函编号（CAS），由大学提供，用于申请学生签证。",
    deposit: "为确认学位而预先支付的款项，会从总学费中扣除。",
  },
};

export function explain(lang: Lang, term: string): { text: string; fallback: boolean } {
  const own = GLOSSARY[lang][term];
  if (own) return { text: own, fallback: false };
  return { text: GLOSSARY.en[term] ?? "", fallback: lang !== "en" };
}

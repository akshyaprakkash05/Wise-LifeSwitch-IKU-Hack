import type { Lang } from "@/lib/types";

// Text for the Scam Shield page (Anusha). Builds on Sadana's checks in src/lib/scam.
// Languages without a translation here (Spanish, French, Chinese) fall back to English.
// Tamil and Hindi drafted with AI help: have a native speaker check before the demo.

export const SHIELD_EN = {
  title: "Scam Shield",
  sub: "Check a payment request before you send money.",
  paste: "Paste a message",
  upload: "Upload a screenshot",
  pasteLabel: "The message asking you to pay",
  pastePlaceholder: "Paste the WhatsApp, text or email here…",
  check: "Check it",
  checking: "Checking…",
  chooseFile: "Choose a screenshot, photo or PDF",
  tryScam: "Try a scam message",
  tryReal: "Try a genuine invoice",
  whatWeRead: "What we read",
  readByAi: "Read by AI. Check it matches the message, and fix anything that's wrong.",
  readByPatterns: "Read automatically. Check it matches the message, and fix anything that's wrong.",
  payee: "Who wants paying",
  amount: "Amount",
  accountName: "Account name",
  sortCode: "Sort code",
  accountNumber: "Account number",
  iban: "IBAN",
  bic: "BIC / SWIFT",
  recheck: "Check again",
  verdictHigh: "Stop. This could be a scam.",
  verdictMedium: "Worth a quick check before you pay.",
  verdictLow: "No warning signs found.",
  risk: "Risk {score}/100",
  inMessage: "In the message",
  highlightNote: "Highlighted words are common in payment scams.",
  why: "Why we flagged this",
  bankCheck: "Bank details check",
  bankOk: "Bank details pass the basic checks.",
  nextSteps: "What to do next",
  stepDontPay: "Don't pay yet.",
  stepCall: "Contact them using a phone number or email you already had, not one from this message.",
  stepNeverGift: "Rent, deposits and fees are never paid in gift cards or crypto.",
  stepReport: "If it's a scam, report it to Action Fraud on 0300 123 2040 or at actionfraud.police.uk.",
  stepForward: "Forward scam texts to 7726 for free.",
  stepBank: "Already paid? Call your bank straight away.",
  stepMediumCheck: "Check the name, amount and bank details match what you expected.",
  stepLowGo: "Still only pay people you expected to pay.",
  continuePay: "Continue to Payments",
  confirmGenuine: "I've contacted them using details I already had, and this is genuine.",
  aiNote: "AI only reads the message. The warning signs are fixed rules, so every warning can be explained.",
  errRead: "We couldn't read that. Try pasting the text instead.",
  errCheck: "The safety check couldn't run. Try again.",
};

export type ShieldKey = keyof typeof SHIELD_EN;

const SHIELD_TA: Partial<Record<ShieldKey, string>> = {
  title: "மோசடி பாதுகாப்பு",
  sub: "பணம் அனுப்பும் முன் கட்டணக் கோரிக்கையைச் சரிபாருங்கள்.",
  paste: "செய்தியை ஒட்டவும்",
  upload: "ஸ்கிரீன்ஷாட்டைப் பதிவேற்றவும்",
  check: "சரிபார்",
  verdictHigh: "நிறுத்துங்கள். இது மோசடியாக இருக்கலாம்.",
  verdictMedium: "செலுத்தும் முன் ஒருமுறை சரிபாருங்கள்.",
  verdictLow: "எச்சரிக்கை அறிகுறிகள் எதுவும் இல்லை.",
  why: "ஏன் எச்சரிக்கிறோம்",
  nextSteps: "அடுத்து என்ன செய்வது",
  stepDontPay: "இப்போதைக்குச் செலுத்த வேண்டாம்.",
  stepCall: "இந்தச் செய்தியில் உள்ளதை அல்ல, உங்களிடம் ஏற்கனவே உள்ள தொலைபேசி எண் அல்லது மின்னஞ்சல் மூலம் அவர்களைத் தொடர்பு கொள்ளுங்கள்.",
};

const SHIELD_HI: Partial<Record<ShieldKey, string>> = {
  title: "धोखाधड़ी सुरक्षा",
  sub: "पैसे भेजने से पहले भुगतान अनुरोध जाँचें।",
  paste: "संदेश पेस्ट करें",
  upload: "स्क्रीनशॉट अपलोड करें",
  check: "जाँचें",
  verdictHigh: "रुकिए। यह धोखाधड़ी हो सकती है।",
  verdictMedium: "भुगतान से पहले एक बार जाँच लें।",
  verdictLow: "कोई चेतावनी संकेत नहीं मिला।",
  why: "हमने इसे क्यों चिह्नित किया",
  nextSteps: "आगे क्या करें",
  stepDontPay: "अभी भुगतान न करें।",
  stepCall: "इस संदेश वाले नहीं, बल्कि पहले से आपके पास मौजूद फ़ोन नंबर या ईमेल से उनसे संपर्क करें।",
};

const BY_LANG: Partial<Record<Lang, Partial<Record<ShieldKey, string>>>> = { ta: SHIELD_TA, hi: SHIELD_HI };

export function sht(lang: Lang, key: ShieldKey, vars?: Record<string, string | number>): string {
  let text = BY_LANG[lang]?.[key] || SHIELD_EN[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

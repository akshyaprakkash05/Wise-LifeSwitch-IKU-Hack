import type { Lang } from "@/lib/types";

// Text for the Group Split screens (Anusha).
// Languages without a translation here (Spanish, French, Chinese) fall back to English.
// Tamil and Hindi drafted with AI help: have a native speaker check before the demo.

export const SPLIT_EN = {
  title: "Group Split",
  sub: "Snap a bill. Everyone pays only for what they had.",
  snap: "Take a photo of the receipt",
  reading: "Reading the receipt…",
  who: "Who's splitting",
  addPerson: "Add a flatmate",
  add: "Add",
  remove: "Remove {name}",
  payer: "Who paid the bill?",
  tapWho: "Tap the people who had each item. Shared items are split between them.",
  evenly: "Split everything evenly",
  extras: "Service and extras {amount}, shared in proportion to what each person had.",
  eachPays: "Each person pays",
  paidBill: "paid the bill",
  needPeople: "Add at least one more person",
  needTags: "Tag someone on {n} more item(s)",
  create: "Send everyone their share",
  paidBy: "Paid by {name}",
  paidCount: "{paid} of {total} paid",
  sendLink: "Send link",
  linkText: "Here's your share. Tap to pay.",
  newHint: "Send this page to everyone. They pick their name and pay their share with Apple Pay. You'll see each payment arrive here.",
  whichOne: "Which one are you?",
  yourShare: "Your share, {name}",
  notYou: "Not you?",
  youPaidBill: "You paid the bill",
  paidWith: "Paid with {method}",
  paid: "Paid",
  waiting: "Waiting",
  everyone: "Everyone",
  anotherWay: "I paid {name} another way",
  testMode: "Test mode: Apple Pay runs for real on your phone, but no money is taken.",
  noStripe: "Card payments aren't set up on this server yet.",
  noWallet: "Apple Pay isn't available here. Open this link in Safari on your iPhone.",
  loading: "Loading…",
  errGeneric: "Something went wrong. Try again.",
  openSplit: "Split a bill with the Circle",
};

export type SplitKey = keyof typeof SPLIT_EN;

const SPLIT_TA: Partial<Record<SplitKey, string>> = {
  title: "பில் பகிர்வு",
  sub: "பில்லைப் படம் எடுங்கள். ஒவ்வொருவரும் தாங்கள் வாங்கியதற்கு மட்டும் செலுத்துவார்கள்.",
  snap: "ரசீதைப் படம் எடுங்கள்",
  who: "யார் பகிர்கிறார்கள்",
  payer: "பில்லை யார் செலுத்தினார்?",
  eachPays: "ஒவ்வொருவரும் செலுத்த வேண்டியது",
  create: "அனைவருக்கும் அவர்களின் பங்கை அனுப்பு",
  whichOne: "நீங்கள் யார்?",
  yourShare: "உங்கள் பங்கு, {name}",
  paid: "செலுத்தப்பட்டது",
  waiting: "காத்திருக்கிறது",
  everyone: "அனைவரும்",
};

const SPLIT_HI: Partial<Record<SplitKey, string>> = {
  title: "ग्रुप स्प्लिट",
  sub: "बिल की फ़ोटो लें। हर कोई सिर्फ़ अपने हिस्से का भुगतान करे।",
  snap: "रसीद की फ़ोटो लें",
  who: "कौन बाँट रहा है",
  payer: "बिल किसने भरा?",
  eachPays: "हर व्यक्ति कितना देगा",
  create: "सबको उनका हिस्सा भेजें",
  whichOne: "आप कौन हैं?",
  yourShare: "आपका हिस्सा, {name}",
  paid: "भुगतान हुआ",
  waiting: "बाक़ी",
  everyone: "सभी",
};

const BY_LANG: Partial<Record<Lang, Partial<Record<SplitKey, string>>>> = { ta: SPLIT_TA, hi: SPLIT_HI };

export function st(lang: Lang, key: SplitKey, vars?: Record<string, string | number>): string {
  let text = BY_LANG[lang]?.[key] || SPLIT_EN[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

/** Receipts can be in any currency, so format with Intl rather than the GBP/USD helpers. */
export function minorMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

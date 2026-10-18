import type { Lang } from "@/lib/types";

// Text for the Circle screens (Anusha).
// Languages without a translation here (Spanish, French, Chinese) fall back to English.
// Tamil and Hindi drafted with AI help: have a native speaker check before the demo.

export const CIRCLE_EN = {
  title: "Circle",
  sub: "Your family, close by. You choose what they see.",
  startTitle: "Start your Circle",
  startBody: "A private group for you and your family. Share updates like “Rent paid” or “Landed in London”, and chat.",
  yourName: "Your name",
  youAre: "You are",
  create: "Create my Circle",
  haveCode: "Got an invite code?",
  codeLabel: "Invite code",
  join: "Join",
  joinTitle: "You've been invited",
  joinBody: "Join to see their moving-abroad updates and chat. They choose what they share, and so do you.",
  joinCta: "Join the Circle",
  invite: "Invite family",
  inviteText: "Join my LifeSwitch Circle so we can stay close while I move abroad.",
  linkCopied: "Invite link copied",
  you: "you",
  activeNow: "active now",
  shareTitle: "Share my updates",
  shareOn: "Payments and location appear in the feed.",
  shareOff: "Paused. Nothing new is shared.",
  shareWhere: "Share where I am",
  locating: "Finding you…",
  cityOnly: "Only your city is shared, never your exact location.",
  locNoSupport: "This browser can't share location.",
  locDenied: "Location is off for this site. Allow it in Settings → Safari → Location.",
  locFail: "Couldn't get your location. Try again.",
  isIn: "is in {place}",
  tabFeed: "Activity",
  tabChat: "Chat",
  noMessages: "No messages yet. Say hi!",
  messagePlaceholder: "Message your Circle",
  send: "Send",
  paidPill: "Paid",
  justNow: "just now",
  minAgo: "{n} min ago",
  hAgo: "{n} h ago",
  dAgo: "{n} d ago",
  loading: "Loading your Circle…",
  noDb: "The shared database isn't connected yet. Add DATABASE_URL to .env.local and restart.",
  gone: "This Circle no longer exists.",
  startNew: "Start a new one",
  errGeneric: "Something went wrong. Try again.",
  rel_student: "Student",
  rel_mum: "Mum",
  rel_dad: "Dad",
  rel_sibling: "Sibling",
  rel_grandparent: "Grandparent",
  rel_partner: "Partner",
  rel_friend: "Friend",
  rel_family: "Other family",
};

export type CircleKey = keyof typeof CIRCLE_EN;

const CIRCLE_TA: Partial<Record<CircleKey, string>> = {
  title: "குடும்ப வட்டம்",
  sub: "உங்கள் குடும்பம், அருகிலேயே. அவர்கள் எதைப் பார்க்கலாம் என்பதை நீங்களே தேர்வு செய்யுங்கள்.",
  startTitle: "உங்கள் வட்டத்தைத் தொடங்குங்கள்",
  startBody: "உங்களுக்கும் உங்கள் குடும்பத்துக்குமான தனிப்பட்ட குழு. “வாடகை செலுத்தப்பட்டது” அல்லது “லண்டன் வந்தடைந்தேன்” போன்ற செய்திகளைப் பகிருங்கள், பேசுங்கள்.",
  yourName: "உங்கள் பெயர்",
  youAre: "நீங்கள்",
  create: "என் வட்டத்தை உருவாக்கு",
  haveCode: "அழைப்புக் குறியீடு உள்ளதா?",
  codeLabel: "அழைப்புக் குறியீடு",
  join: "சேர்",
  joinTitle: "உங்களுக்கு அழைப்பு வந்துள்ளது",
  joinCta: "வட்டத்தில் சேர்",
  invite: "குடும்பத்தை அழை",
  you: "நீங்கள்",
  shareTitle: "என் செய்திகளைப் பகிர்",
  shareWhere: "நான் எங்கே இருக்கிறேன் என்று பகிர்",
  cityOnly: "உங்கள் நகரம் மட்டுமே பகிரப்படும், சரியான இடம் ஒருபோதும் இல்லை.",
  isIn: "{place} இல் இருக்கிறார்",
  tabFeed: "செயல்பாடு",
  tabChat: "அரட்டை",
  noMessages: "இன்னும் செய்திகள் இல்லை. வணக்கம் சொல்லுங்கள்!",
  messagePlaceholder: "உங்கள் வட்டத்துக்குச் செய்தி அனுப்புங்கள்",
  send: "அனுப்பு",
  paidPill: "செலுத்தப்பட்டது",
  justNow: "இப்போது",
  rel_student: "மாணவர்",
  rel_mum: "அம்மா",
  rel_dad: "அப்பா",
  rel_sibling: "உடன்பிறப்பு",
  rel_grandparent: "தாத்தா/பாட்டி",
  rel_friend: "நண்பர்",
};

const CIRCLE_HI: Partial<Record<CircleKey, string>> = {
  title: "परिवार सर्कल",
  sub: "आपका परिवार, आपके पास। वे क्या देखें, यह आप तय करते हैं।",
  startTitle: "अपना सर्कल शुरू करें",
  startBody: "आपके और आपके परिवार के लिए एक निजी ग्रुप। “किराया भर दिया” या “लंदन पहुँच गई” जैसे अपडेट शेयर करें और बात करें।",
  yourName: "आपका नाम",
  youAre: "आप हैं",
  create: "मेरा सर्कल बनाएँ",
  haveCode: "इनवाइट कोड है?",
  codeLabel: "इनवाइट कोड",
  join: "जुड़ें",
  joinTitle: "आपको आमंत्रित किया गया है",
  joinCta: "सर्कल से जुड़ें",
  invite: "परिवार को बुलाएँ",
  you: "आप",
  shareTitle: "मेरे अपडेट शेयर करें",
  shareWhere: "मैं कहाँ हूँ, शेयर करें",
  cityOnly: "सिर्फ़ आपका शहर शेयर होता है, आपकी सही लोकेशन कभी नहीं।",
  isIn: "{place} में हैं",
  tabFeed: "गतिविधि",
  tabChat: "चैट",
  noMessages: "अभी कोई संदेश नहीं। नमस्ते कहें!",
  messagePlaceholder: "अपने सर्कल को संदेश भेजें",
  send: "भेजें",
  paidPill: "भुगतान हुआ",
  justNow: "अभी",
  rel_student: "छात्र",
  rel_mum: "माँ",
  rel_dad: "पापा",
  rel_sibling: "भाई/बहन",
  rel_grandparent: "दादा/दादी",
  rel_friend: "दोस्त",
};

const BY_LANG: Partial<Record<Lang, Partial<Record<CircleKey, string>>>> = { ta: CIRCLE_TA, hi: CIRCLE_HI };

export function ct(lang: Lang, key: CircleKey, vars?: Record<string, string | number>): string {
  let text = BY_LANG[lang]?.[key] || CIRCLE_EN[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

/** Relations are stored in English and shown in the viewer's language. */
export const RELATIONS: { value: string; key: CircleKey }[] = [
  { value: "Student", key: "rel_student" },
  { value: "Mum", key: "rel_mum" },
  { value: "Dad", key: "rel_dad" },
  { value: "Sibling", key: "rel_sibling" },
  { value: "Grandparent", key: "rel_grandparent" },
  { value: "Partner", key: "rel_partner" },
  { value: "Friend", key: "rel_friend" },
  { value: "Other family", key: "rel_family" },
];

export const relationLabel = (lang: Lang, value: string) => {
  const r = RELATIONS.find((x) => x.value === value);
  return r ? ct(lang, r.key) : value;
};

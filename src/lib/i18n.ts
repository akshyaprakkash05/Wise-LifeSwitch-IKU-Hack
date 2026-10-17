import type { Lang } from "./types";

export const LANGS: { code: Lang; label: string; speech: string }[] = [
  { code: "en", label: "English", speech: "en-GB" },
  { code: "ta", label: "தமிழ் (Tamil)", speech: "ta-IN" },
  { code: "hi", label: "हिन्दी (Hindi)", speech: "hi-IN" },
  { code: "es", label: "Español", speech: "es-ES" },
  { code: "fr", label: "Français", speech: "fr-FR" },
  { code: "zh", label: "中文 (Chinese)", speech: "zh-CN" },
];

const en = {
  nav_home: "Roadmap",
  nav_setup: "Set up move",
  nav_docs: "Documents",
  nav_pay: "Payments",
  nav_rem: "Reminders",
  nav_circle: "Circle",
  nav_split: "Group Split",
  nav_shield: "Scam Shield",
  nav_care: "Care Card",
  greet: "Hi",
  sorted: "Your move is {p}% sorted.",
  next: "Next up",
  payWise: "Pay with Wise",
  roadmap: "Your money roadmap",
  budget: "First-term budget",
  progress: "Progress",
  newWords: "New words? Tap one.",
  listen: "Listen",
  addDoc: "Add document",
  setupSub: "Tell us about your move. It takes under a minute.",
  buildPlan: "Build my plan",
};
export type MessageKey = keyof typeof en;

const MESSAGES: Record<Lang, Partial<Record<MessageKey, string>>> = {
  en,
  ta: {
    nav_home: "பாதை வரைபடம்", nav_setup: "பயணத்தை அமை", nav_docs: "ஆவணங்கள்", nav_pay: "கட்டணங்கள்", nav_rem: "நினைவூட்டல்கள்",
    nav_circle: "வட்டம்", nav_split: "பில் பகிர்வு", nav_shield: "மோசடி கவசம்", nav_care: "கேர் கார்டு",
    greet: "வணக்கம்", sorted: "உங்கள் பயணம் {p}% தயார்.", next: "அடுத்தது", payWise: "Wise மூலம் செலுத்து",
    roadmap: "உங்கள் பண வரைபடம்", budget: "முதல் பருவ பட்ஜெட்", progress: "முன்னேற்றம்",
    newWords: "புதிய சொற்களா? ஒன்றைத் தட்டவும்.", listen: "கேளுங்கள்", addDoc: "ஆவணம் சேர்", setupSub: "உங்கள் இடமாற்றம் பற்றிச் சொல்லுங்கள். ஒரு நிமிடம் கூட ஆகாது.", buildPlan: "எனது திட்டத்தை உருவாக்கு",
  },
  hi: {
    nav_home: "रोडमैप", nav_setup: "मूव सेट करें", nav_docs: "दस्तावेज़", nav_pay: "भुगतान", nav_rem: "रिमाइंडर",
    nav_circle: "सर्कल", nav_split: "ग्रुप स्प्लिट", nav_shield: "स्कैम शील्ड", nav_care: "केयर कार्ड",
    greet: "नमस्ते", sorted: "आपका मूव {p}% तैयार है।", next: "अगला", payWise: "Wise से भुगतान करें",
    roadmap: "आपका मनी रोडमैप", budget: "पहले टर्म का बजट", progress: "प्रगति",
    newWords: "नए शब्द? किसी एक पर टैप करें।", listen: "सुनें", addDoc: "दस्तावेज़ जोड़ें", setupSub: "अपने मूव के बारे में बताइए। एक मिनट से भी कम लगेगा।", buildPlan: "मेरा प्लान बनाएँ",
  },
  es: {
    nav_home: "Hoja de ruta", nav_setup: "Configurar mudanza", nav_docs: "Documentos", nav_pay: "Pagos", nav_rem: "Recordatorios",
    nav_circle: "Círculo", nav_split: "Dividir gastos", nav_shield: "Escudo antifraude", nav_care: "Tarjeta Care",
    greet: "Hola", sorted: "Tu mudanza está {p}% lista.", next: "Lo siguiente", payWise: "Pagar con Wise",
    roadmap: "Tu hoja de ruta financiera", budget: "Presupuesto del primer trimestre", progress: "Progreso",
    newWords: "¿Palabras nuevas? Toca una.", listen: "Escuchar", addDoc: "Añadir documento", setupSub: "Cuéntanos sobre tu mudanza. Tarda menos de un minuto.", buildPlan: "Crear mi plan",
  },
  fr: {
    nav_home: "Feuille de route", nav_setup: "Préparer le départ", nav_docs: "Documents", nav_pay: "Paiements", nav_rem: "Rappels",
    nav_circle: "Cercle", nav_split: "Partager l’addition", nav_shield: "Bouclier anti-arnaque", nav_care: "Carte Care",
    greet: "Bonjour", sorted: "Votre départ est prêt à {p} %.", next: "À venir", payWise: "Payer avec Wise",
    roadmap: "Votre feuille de route financière", budget: "Budget du premier trimestre", progress: "Progression",
    newWords: "Nouveaux mots ? Touchez-en un.", listen: "Écouter", addDoc: "Ajouter un document", setupSub: "Parlez-nous de votre départ. Cela prend moins d’une minute.", buildPlan: "Créer mon plan",
  },
  zh: {
    nav_home: "路线图", nav_setup: "设置搬迁", nav_docs: "文件", nav_pay: "付款", nav_rem: "提醒",
    nav_circle: "家人圈", nav_split: "分账", nav_shield: "防诈骗", nav_care: "关爱卡",
    greet: "你好", sorted: "你的搬迁已完成 {p}%。", next: "下一项", payWise: "用 Wise 支付",
    roadmap: "你的资金路线图", budget: "第一学期预算", progress: "进度",
    newWords: "有生词？点一下。", listen: "收听", addDoc: "添加文件", setupSub: "告诉我们你的搬迁计划，不到一分钟。", buildPlan: "生成我的计划",
  },
};

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  let text = MESSAGES[lang][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  return text;
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

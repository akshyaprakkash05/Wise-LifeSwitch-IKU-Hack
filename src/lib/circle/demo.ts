import type { MessageKey } from "@/lib/messages/en";

/**
 * The sample Circle shown until a real one is created: Tara in London, her mum in
 * Chennai and her brother in Dubai. Everything here is translated through message
 * keys, so the demo reads naturally in every language.
 */

export interface CirclePerson {
  id: string;
  name: string;
  /** Message key for how they relate to the user ("You", "Mum", "Brother"), or plain text from a real Circle. */
  relation: string;
  relationKey?: MessageKey;
  city: string | null;
  /** Message key for a short status ("At home"), demo only. */
  statusKey?: MessageKey;
  /** Minutes since their city was last updated. */
  updatedMinsAgo?: number;
  bg: string;
  fg: string;
  isMe: boolean;
}

export const DEMO_PEOPLE: CirclePerson[] = [
  { id: "me", name: "Tara", relation: "You", relationKey: "you", city: "London", statusKey: "cc_st_me", updatedMinsAgo: 0, bg: "#9FE870", fg: "#163300", isMe: true },
  { id: "mum", name: "Mum", relation: "Mum", relationKey: "mum", city: "Chennai", statusKey: "cc_st_mum", updatedMinsAgo: 5, bg: "#FF9A1F", fg: "#5C3200", isMe: false },
  { id: "ravi", name: "Ravi", relation: "Brother", relationKey: "cc_brother", city: "Dubai", statusKey: "cc_st_ravi", updatedMinsAgo: 20, bg: "#FFD7EF", fg: "#5A1240", isMe: false },
];

export interface ChatLine {
  id: string;
  /** Person id, or "sys" for a centred system note. */
  from: string;
  text: string;
  /** "09:12" style time, already formatted. */
  time?: string;
}

/** Seed messages as keys, so they switch language with the app. */
export const DEMO_CHAT: { id: string; from: string; key: MessageKey; time?: string }[] = [
  { id: "c0", from: "sys", key: "cc_joined" },
  { id: "c1", from: "mum", key: "cc_chat1", time: "09:12" },
  { id: "c2", from: "me", key: "cc_chat2", time: "09:20" },
  { id: "c3", from: "ravi", key: "cc_chat3", time: "10:02" },
];

/** Payment words that make Mum's reply a "well done" rather than a "call us". */
export const PAYMENT_WORDS = /pa(id|y)|rent|fee|deposit|sent|பணம்|கட்ட|भुगतान|किराया|pag|loyer|pay|付|租|费/i;

/** Distinct avatar colours for people in a real Circle, in join order. */
export const PALETTE: { bg: string; fg: string }[] = [
  { bg: "#9FE870", fg: "#163300" },
  { bg: "#FF9A1F", fg: "#5C3200" },
  { bg: "#FFD7EF", fg: "#5A1240" },
  { bg: "#A0E1E1", fg: "#0E3B3B" },
  { bg: "#FFEB69", fg: "#3D3500" },
  { bg: "#FFC091", fg: "#5C2A00" },
];

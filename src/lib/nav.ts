import type { IconName } from "@/components/Icon";
import type { MessageKey } from "./i18n";

export interface NavItem {
  href: string;
  label: MessageKey;
  icon: IconName;
  /** Section break drawn above this item. */
  breakBefore?: boolean;
  /** Short description used on pages that aren't built yet. */
  blurb: string;
  /** Set to true when the real page exists in src/app/<route>/page.tsx (removes the "Coming next" placeholder). */
  live?: boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "nav_home", icon: "route", blurb: "Your money roadmap.", live: true },
  { href: "/setup", label: "nav_setup", icon: "compass", blurb: "Origin, destination, purpose and language in under a minute." },
  { href: "/documents", label: "nav_docs", icon: "doc", breakBefore: true, blurb: "Drop in any relocation document. AI finds every payment, and you check each one.", live: true },
  { href: "/payments", label: "nav_pay", icon: "swap", blurb: "Every payment is prepared for you. Nothing is sent until you confirm.", live: true },
  { href: "/reminders", label: "nav_rem", icon: "bell", blurb: "We remind you before every due date.", live: true },
  { href: "/circle", label: "nav_circle", icon: "users", breakBefore: true, blurb: "Your family, close by. You choose what they see." },
  { href: "/split", label: "nav_split", icon: "receipt", blurb: "Snap a bill. Everyone pays only for what they had." },
  { href: "/shield", label: "nav_shield", icon: "shield", blurb: "Check a payment request before you send money." },
  { href: "/care", label: "nav_care", icon: "heart", blurb: "Safer spending for someone you care for, without taking away independence." },
];

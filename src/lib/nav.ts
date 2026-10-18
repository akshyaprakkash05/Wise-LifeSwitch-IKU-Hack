import type { IconName } from "@/components/Icon";
import type { MessageKey } from "./i18n";

export interface NavItem {
  href: string;
  label: MessageKey;
  icon: IconName;
  /** Section break drawn above this item. */
  breakBefore?: boolean;
  /** Short description shown on pages that aren't built yet. */
  blurb?: MessageKey;
  /** Set to true when the real page exists in src/app/<route>/page.tsx (removes the "Coming next" placeholder). */
  live?: boolean;
}

export const NAV: NavItem[] = [
  { href: "/", label: "nav_home", icon: "route", live: true },
  { href: "/setup", label: "nav_setup", icon: "compass", live: true },
  { href: "/documents", label: "nav_docs", icon: "doc", breakBefore: true, blurb: "sub_docs", live: true },
  { href: "/payments", label: "nav_pay", icon: "swap", blurb: "sub_pay", live: true },
  { href: "/reminders", label: "nav_rem", icon: "bell", blurb: "sub_rem", live: true },
  { href: "/circle", label: "nav_circle", icon: "users", breakBefore: true, blurb: "sub_circle", live: true },
  { href: "/split", label: "nav_split", icon: "receipt", blurb: "sub_split", live: true },
  { href: "/shield", label: "nav_shield", icon: "shield", blurb: "sub_shield", live: true },
  { href: "/care", label: "nav_care", icon: "heart", blurb: "sub_care", live: true },
];

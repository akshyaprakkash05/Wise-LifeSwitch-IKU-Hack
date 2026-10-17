"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FileUp, Map, Users, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { ReminderPopup } from "@/components/reminder-popup";

const TABS = [
  { href: "/roadmap", key: "nav.home", icon: Map },
  { href: "/upload", key: "nav.upload", icon: FileUp },
  { href: "/pay", key: "nav.pay", icon: Wallet },
  { href: "/circle", key: "nav.circle", icon: Users },
  { href: "/reminders", key: "nav.more", icon: Bell },
] as const;

/** Mobile-first frame: content column plus a bottom tab bar once a move is set up. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { profile } = useStore();
  const showNav = Boolean(profile) && path !== "/";

  return (
    <div className="mx-auto min-h-dvh max-w-2xl">
      <main className={clsx("px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)]", showNav ? "pb-28" : "pb-10")}>{children}</main>
      {showNav && path !== "/reminders" && <ReminderPopup />}
      {showNav && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        >
          <ul className="mx-auto grid max-w-2xl grid-cols-5">
            {TABS.map(({ href, key, icon: Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold",
                      active ? "text-ink" : "text-muted",
                    )}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden />
                    {href === "/reminders" ? "Reminders" : t(profile?.language, key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

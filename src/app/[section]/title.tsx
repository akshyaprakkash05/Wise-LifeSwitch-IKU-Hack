"use client";

import type { MessageKey } from "@/lib/i18n";
import { useApp } from "@/state/app-state";

export function ComingNextTitle({ label }: { label: MessageKey }) {
  const { t } = useApp();
  return <h1 className="disp">{t(label)}</h1>;
}

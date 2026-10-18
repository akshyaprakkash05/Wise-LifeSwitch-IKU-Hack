"use client";

import Link from "next/link";
import type { MessageKey } from "@/lib/i18n";
import { useApp } from "@/state/app-state";

/** Page heading and blurb for a section that isn't built yet, in the chosen language. */
export function ComingNextTitle({ label, blurb }: { label: MessageKey; blurb?: MessageKey }) {
  const { t } = useApp();
  return (
    <div className="phead">
      <div>
        <h1 className="disp">{t(label)}</h1>
        {blurb && <p>{t(blurb)}</p>}
      </div>
    </div>
  );
}

export function ComingNextCard() {
  const { t } = useApp();
  return (
    <div className="card" style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <span className="pill p-fam" style={{ justifySelf: "start" }}>{t("comingNext")}</span>
      <p>{t("comingBody")}</p>
      <Link href="/" className="btn dark" style={{ justifySelf: "start" }}>
        {t("backToRoadmap")}
      </Link>
    </div>
  );
}

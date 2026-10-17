"use client";

import Link from "next/link";
import { PERSON } from "@/lib/demo-data";
import { summarise } from "@/lib/roadmap";
import { useApp } from "@/state/app-state";
import { Icon } from "../Icon";
import { VoiceButton } from "../VoiceButton";
import { BoardingPass } from "./BoardingPass";
import { BudgetCard } from "./BudgetCard";
import { CircleCard } from "./CircleCard";
import { PaymentDetail } from "./PaymentDetail";
import { ProgressCard } from "./ProgressCard";
import { ReminderBanner } from "./ReminderBanner";
import { Timeline } from "./Timeline";

export function RoadmapPage() {
  const { t, items, state, money } = useApp();
  const summary = summarise(items, state.paid);

  return (
    <>
      <div className="phead">
        <h1 className="disp">
          {t("greet", { name: PERSON.name })}
          <br />
          <span style={{ color: "var(--muted)", fontWeight: 700 }}>{t("sorted", { p: summary.percent })}</span>
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <VoiceButton />
          <Link href="/documents" className="btn ink">
            <Icon name="plus" size={18} stroke={2.4} />
            {t("addDoc")}
          </Link>
        </div>
      </div>

      <ReminderBanner />
      <BoardingPass summary={summary} />

      <div className="grid3">
        <ProgressCard summary={summary} />
        <BudgetCard />
        <CircleCard />
      </div>

      <div className="row">
        <Timeline />
        <PaymentDetail />
      </div>

      <p className="foot">
        {t("footSample", { name: PERSON.name })}{" "}
        {state.fx.source === "live"
          ? t("rateLive", { rate: state.fx.rate.toFixed(4), date: state.fx.asOf })
          : t("rateSampleFoot", { rate: state.fx.rate })}{" "}
        {t("totalRoadmap", { amount: money(summary.total) })}
      </p>
    </>
  );
}

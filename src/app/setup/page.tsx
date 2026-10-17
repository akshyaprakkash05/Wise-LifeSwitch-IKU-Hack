import type { Metadata } from "next";
import { SetupPage } from "@/components/setup/SetupPage";

export const metadata: Metadata = { title: "Set up move · Wise LifeSwitch" };

export default function Setup() {
  return <SetupPage />;
}

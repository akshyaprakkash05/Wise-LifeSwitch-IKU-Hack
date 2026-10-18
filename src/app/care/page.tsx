import type { Metadata } from "next";
import { CareCardPage } from "@/components/care/CareCardPage";

export const metadata: Metadata = { title: "Care Card · Wise LifeSwitch" };

export default function Care() {
  return <CareCardPage />;
}

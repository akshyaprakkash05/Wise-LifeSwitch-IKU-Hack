import { notFound } from "next/navigation";
import { NAV } from "@/lib/nav";
import { ComingNextCard, ComingNextTitle } from "./title";

/** Pages that are designed in the mock-up but not built yet. The Roadmap at "/" is the live one. */
export const dynamicParams = false;

export function generateStaticParams() {
  return NAV.filter((n) => !n.live).map((n) => ({ section: n.href.slice(1) }));
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV.find((n) => n.href === `/${section}`);
  if (!item) notFound();

  return (
    <>
      <ComingNextTitle label={item.label} blurb={item.blurb} />
      <ComingNextCard />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { NAV } from "@/lib/nav";
import { ComingNextTitle } from "./title";

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
      <div className="phead">
        <div>
          <ComingNextTitle label={item.label} />
          <p>{item.blurb}</p>
        </div>
      </div>
      <div className="card" style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <span className="pill p-fam" style={{ justifySelf: "start" }}>Coming next</span>
        <p>This screen is designed in the mock-up and is next on the build list. The Roadmap is live now.</p>
        <Link href="/" className="btn dark" style={{ justifySelf: "start" }}>
          Back to the Roadmap
        </Link>
      </div>
    </>
  );
}

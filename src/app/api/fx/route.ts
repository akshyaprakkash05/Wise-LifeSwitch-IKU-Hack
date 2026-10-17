import { NextResponse } from "next/server";
import { CurrencySchema } from "@/lib/schemas";
import { getRate } from "@/lib/services/fx";

// GET /api/fx?from=GBP&to=INR
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = CurrencySchema.safeParse(searchParams.get("from"));
  const to = CurrencySchema.safeParse(searchParams.get("to"));
  if (!from.success || !to.success) {
    return NextResponse.json({ error: "Use ?from=GBP&to=INR with a supported currency." }, { status: 400 });
  }
  const result = await getRate(from.data, to.data);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

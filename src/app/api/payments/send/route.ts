import { NextResponse } from "next/server";
import { KNOWN_PAYEES } from "@/lib/tabs/samples";
import { checkBankDetails } from "@/lib/scam/bank";
import { assessPayment } from "@/lib/scam/shield";
import type { RoadmapItem } from "@/lib/types";

/**
 * POST /api/payments/send  { item: RoadmapItem, reference: string, confirmRisk?: boolean }
 * Re-runs every check on the server before "sending", so the browser can't skip one.
 * The transfer itself is still mocked: this is where the Wise sandbox call goes.
 */
export async function POST(req: Request) {
  let body: { item?: Partial<RoadmapItem>; reference?: string; confirmRisk?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON with an `item`." }, { status: 400 });
  }
  const item = body.item;
  const reference = (body.reference ?? "").trim();
  if (!item || typeof item !== "object") return NextResponse.json({ error: "Missing payment." }, { status: 400 });
  if (typeof item.amountGbp !== "number" || !(item.amountGbp > 0)) return NextResponse.json({ error: "The amount must be more than zero." }, { status: 400 });
  if (!item.payee?.trim()) return NextResponse.json({ error: "Who to pay is missing." }, { status: 400 });
  if (reference.length < 2) return NextResponse.json({ error: "Add a payment reference first." }, { status: 400 });

  const bankIssues = item.bank ? checkBankDetails(item.bank) : [];
  if (bankIssues.length) return NextResponse.json({ error: bankIssues[0].message }, { status: 400 });

  const report = assessPayment(
    { payee: item.payee, bank: item.bank, source_text: item.sourceText ?? null, source_snippet: item.sourceSnippet ?? null, amount: item.amountGbp, currency: "GBP" },
    KNOWN_PAYEES,
  );
  if (report.level === "high" && body.confirmRisk !== true) {
    return NextResponse.json({ error: "Scam Shield flagged this payment. Confirm you've checked it with the recipient first.", report }, { status: 409 });
  }

  return NextResponse.json({
    id: `demo_${Date.now().toString(36)}`,
    status: "sent",
    reference,
    createdAt: new Date().toISOString(),
    risk: report.level,
  });
}

import { NextResponse } from "next/server";
import { KNOWN_PAYEES } from "@/lib/tabs/samples";
import { assessPayment, type ScamInput } from "@/lib/scam/shield";

/**
 * POST /api/scam-check  { item: ScamInput }
 * Runs on the server, with the trusted payee list kept on the server too.
 * In the full build the trusted payees come from the student's saved recipients.
 */
export async function POST(req: Request) {
  let body: { item?: ScamInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON with an `item` field." }, { status: 400 });
  }
  if (!body.item || typeof body.item !== "object") return NextResponse.json({ error: "Missing `item`." }, { status: 400 });
  return NextResponse.json(assessPayment(body.item, KNOWN_PAYEES));
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPayment } from "@/lib/server/split";
import { fail } from "@/lib/server/http";

// POST /api/split/<id>/confirm { shareId } -> checks with Stripe, then marks the share paid
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.uuid().parse((await params).id);
    const { shareId } = z.object({ shareId: z.uuid() }).parse(await req.json());
    return (await confirmPayment(id, shareId))
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "not_paid", message: "Stripe hasn't confirmed this payment." }, { status: 409 });
  } catch (err) {
    return fail(err);
  }
}

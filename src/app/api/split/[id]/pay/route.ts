import { NextResponse } from "next/server";
import { z } from "zod";
import { startPayment } from "@/lib/server/split";
import { fail } from "@/lib/server/http";

// POST /api/split/<id>/pay { shareId } -> { clientSecret, amount_minor, currency }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.uuid().parse((await params).id);
    const { shareId } = z.object({ shareId: z.uuid() }).parse(await req.json());
    const started = await startPayment(id, shareId);
    return started ? NextResponse.json(started) : NextResponse.json({ error: "not_found", message: "Share not found." }, { status: 404 });
  } catch (err) {
    return fail(err);
  }
}

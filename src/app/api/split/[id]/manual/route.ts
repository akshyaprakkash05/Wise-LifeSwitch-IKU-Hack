import { NextResponse } from "next/server";
import { z } from "zod";
import { markPaidManually } from "@/lib/server/split";
import { fail } from "@/lib/server/http";

// POST /api/split/<id>/manual { shareId } -> "I paid another way"
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.uuid().parse((await params).id);
    const { shareId } = z.object({ shareId: z.uuid() }).parse(await req.json());
    return (await markPaidManually(id, shareId))
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "not_found", message: "Share not found or already paid." }, { status: 404 });
  } catch (err) {
    return fail(err);
  }
}

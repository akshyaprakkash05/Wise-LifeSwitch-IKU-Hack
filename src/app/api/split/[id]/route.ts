import { NextResponse } from "next/server";
import { z } from "zod";
import { getSplit } from "@/lib/server/split";
import { fail } from "@/lib/server/http";

// GET /api/split/<id>
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.uuid().parse((await params).id);
    const split = await getSplit(id);
    return split
      ? NextResponse.json(split, { headers: { "Cache-Control": "no-store" } })
      : NextResponse.json({ error: "not_found", message: "This split doesn't exist." }, { status: 404 });
  } catch (err) {
    return fail(err);
  }
}

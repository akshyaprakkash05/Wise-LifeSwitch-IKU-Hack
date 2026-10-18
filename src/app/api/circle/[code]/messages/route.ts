import { NextResponse } from "next/server";
import { z } from "zod";
import { postMessage } from "@/lib/server/circle";
import { CodeSchema, fail, forbidden, MemberIdSchema } from "@/lib/server/http";

const Body = z.object({ memberId: MemberIdSchema, body: z.string().trim().min(1, "Type a message.").max(1000) });

// POST /api/circle/ABC123/messages  { memberId, body }
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const code = CodeSchema.parse((await params).code.toUpperCase());
    const { memberId, body } = Body.parse(await req.json());
    return (await postMessage(code, memberId, body)) ? NextResponse.json({ ok: true }, { status: 201 }) : forbidden();
  } catch (err) {
    return fail(err);
  }
}

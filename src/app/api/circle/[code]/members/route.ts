import { NextResponse } from "next/server";
import { z } from "zod";
import { updateMember } from "@/lib/server/circle";
import { CodeSchema, fail, forbidden, MemberIdSchema } from "@/lib/server/http";

const Body = z.object({
  memberId: MemberIdSchema,
  sharing: z.boolean().optional(),
  last_place: z.string().trim().max(120).optional(),
});

// PATCH /api/circle/ABC123/members  { memberId, sharing?, last_place? }
export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const code = CodeSchema.parse((await params).code.toUpperCase());
    const { memberId, ...patch } = Body.parse(await req.json());
    return (await updateMember(code, memberId, patch)) ? NextResponse.json({ ok: true }) : forbidden();
  } catch (err) {
    return fail(err);
  }
}

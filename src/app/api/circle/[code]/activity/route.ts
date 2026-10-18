import { NextResponse } from "next/server";
import { z } from "zod";
import { addActivity } from "@/lib/server/circle";
import { CodeSchema, fail, forbidden, MemberIdSchema } from "@/lib/server/http";

const Body = z.object({
  memberId: MemberIdSchema,
  kind: z.enum(["payment", "milestone", "checkin", "location"]),
  text: z.string().trim().min(1).max(280),
});

// POST /api/circle/ABC123/activity  { memberId, kind, text }
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const code = CodeSchema.parse((await params).code.toUpperCase());
    const { memberId, kind, text } = Body.parse(await req.json());
    return (await addActivity(code, memberId, kind, text)) ? NextResponse.json({ ok: true }, { status: 201 }) : forbidden();
  } catch (err) {
    return fail(err);
  }
}

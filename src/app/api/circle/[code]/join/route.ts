import { NextResponse } from "next/server";
import { joinCircle } from "@/lib/server/circle";
import { CodeSchema, fail, notFound, PersonSchema } from "@/lib/server/http";

// POST /api/circle/ABC123/join  { name, relation, phone? } -> { code, memberId }
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const code = CodeSchema.parse((await params).code.toUpperCase());
    const joined = await joinCircle(code, PersonSchema.parse(await req.json()));
    return joined ? NextResponse.json(joined, { status: 201 }) : notFound();
  } catch (err) {
    return fail(err);
  }
}

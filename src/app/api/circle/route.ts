import { NextResponse } from "next/server";
import { createCircle } from "@/lib/server/circle";
import { fail, PersonSchema } from "@/lib/server/http";

// POST /api/circle  { name, relation } -> { code, memberId }
export async function POST(req: Request) {
  try {
    const person = PersonSchema.parse(await req.json());
    return NextResponse.json(await createCircle(person), { status: 201 });
  } catch (err) {
    return fail(err);
  }
}

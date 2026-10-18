import { NextResponse } from "next/server";
import { z } from "zod";
import { createSplit } from "@/lib/server/split";
import { fail } from "@/lib/server/http";

const Name = z.string().trim().min(1).max(30);
const Body = z.object({
  receipt: z.object({
    merchant: z.string().trim().min(1).max(80),
    currency: z.string().regex(/^[A-Z]{3}$/),
    extras_minor: z.number().int().min(0).max(10_000_000),
    lines: z.array(z.object({
      name: z.string().trim().min(1).max(80),
      amount_minor: z.number().int().min(0).max(10_000_000),
      people: z.array(Name).max(20),
    })).min(1).max(100),
  }),
  people: z.array(Name).min(2, "Add at least two people.").max(20),
  payer: Name,
  circleCode: z.string().nullish(),
});

// POST /api/split -> { id }
export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const people = [...new Set(body.people)];
    return NextResponse.json({ id: await createSplit({ ...body, people }) }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}

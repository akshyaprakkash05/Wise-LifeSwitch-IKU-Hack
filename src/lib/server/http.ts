import { NextResponse } from "next/server";
import { z } from "zod";
import { NoDatabaseError } from "./db";
import { NoStripeError } from "./stripe";
import { SplitInputError } from "./split";

/** Shared JSON error handling for API routes. */
export function fail(err: unknown) {
  if (err instanceof NoDatabaseError) {
    return NextResponse.json({ error: "no_db", message: "The shared database isn't set up on this server yet." }, { status: 503 });
  }
  if (err instanceof NoStripeError) {
    return NextResponse.json({ error: "no_stripe", message: "Card payments aren't set up on this server yet." }, { status: 503 });
  }
  if (err instanceof SplitInputError) {
    return NextResponse.json({ error: "bad_request", message: err.message }, { status: 400 });
  }
  if (err && typeof err === "object" && "type" in err && String((err as { type: string }).type).startsWith("Stripe")) {
    console.error("[stripe]", (err as unknown as Error).message);
    return NextResponse.json({ error: "stripe", message: "The card payment service had a problem. Try again." }, { status: 502 });
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: "bad_request", message: err.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  console.error("[api]", err);
  return NextResponse.json({ error: "server", message: "Something went wrong. Try again." }, { status: 500 });
}

export const notFound = () => NextResponse.json({ error: "not_found", message: "That Circle doesn't exist." }, { status: 404 });
export const forbidden = () => NextResponse.json({ error: "forbidden", message: "You're not a member of this Circle." }, { status: 403 });

export const CodeSchema = z.string().regex(/^[A-Z2-9]{6}$/, "Invalid invite code.");
export const MemberIdSchema = z.uuid("Invalid member.");
export const PersonSchema = z.object({
  name: z.string().trim().min(1, "Add your name.").max(40),
  relation: z.string().trim().min(1).max(30),
});

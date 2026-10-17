import { NextResponse } from "next/server";
import { getFeed } from "@/lib/server/circle";
import { CodeSchema, fail, notFound } from "@/lib/server/http";

// GET /api/circle/ABC123?a=<last activity id>&m=<last message id>
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const code = CodeSchema.parse((await params).code.toUpperCase());
    const q = new URL(req.url).searchParams;
    const feed = await getFeed(code, { activity: Number(q.get("a")) || 0, message: Number(q.get("m")) || 0 });
    return feed ? NextResponse.json(feed, { headers: { "Cache-Control": "no-store" } }) : notFound();
  } catch (err) {
    return fail(err);
  }
}

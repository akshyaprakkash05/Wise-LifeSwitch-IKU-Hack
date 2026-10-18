import { NextResponse } from "next/server";
import { ReceiptError, scanReceipt } from "@/lib/services/receipt";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/split/scan  (multipart: file) -> { merchant, currency, lines[{name, amount}], extras }
export async function POST(req: Request) {
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "bad_request", message: "Take or choose a photo of the receipt." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "too_large", message: "That photo is over 10 MB." }, { status: 413 });
  }
  try {
    return NextResponse.json(await scanReceipt({ bytes: await file.arrayBuffer(), mimeType: file.type }));
  } catch (err) {
    if (err instanceof ReceiptError) {
      const status = err.code === "no_key" ? 503 : err.code === "unreadable" ? 422 : 502;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    return NextResponse.json({ error: "server", message: "Something went wrong reading the receipt." }, { status: 500 });
  }
}

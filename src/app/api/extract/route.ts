import { NextResponse } from "next/server";
import { ExtractionError, extractPayments } from "@/lib/services/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// POST /api/extract  (multipart: file, origin, destination)
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Send the document as a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "bad_request", message: "No document attached." }, { status: 400 });
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: "bad_type", message: "Upload a PDF or a photo (JPG, PNG, HEIC)." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large", message: "That file is over 10 MB. Try a smaller scan or a photo." }, { status: 413 });
  }

  try {
    const result = await extractPayments(
      { bytes: await file.arrayBuffer(), mimeType: file.type },
      {
        origin: String(form.get("origin") || "India"),
        destination: String(form.get("destination") || "United Kingdom"),
        today: new Date().toISOString().slice(0, 10),
      },
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ExtractionError) {
      const status = err.code === "no_key" ? 503 : err.code === "unreadable" ? 422 : 502;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    console.error("[extract] unexpected:", err);
    return NextResponse.json({ error: "upstream", message: "Something went wrong reading that document." }, { status: 500 });
  }
}

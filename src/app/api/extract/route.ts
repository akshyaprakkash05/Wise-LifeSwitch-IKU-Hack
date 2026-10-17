import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { SAMPLE_FEE_INVOICE, SAMPLE_SCAM_MESSAGE } from "@/lib/tabs/samples";
import { normalizeItems } from "@/lib/tabs/normalize";
import type { ExtractionResult } from "@/lib/tabs/types";

/**
 * POST /api/extract (multipart form)
 *   file:   a PDF or image, or
 *   sample: "fee" | "scam" to run one of the built-in samples.
 *
 * With GEMINI_API_KEY set, Gemini reads the real file and returns JSON, which is then cleaned
 * by normalizeItems(). Without a key, any file returns the sample fee invoice (the UI says so).
 * Check the model name in Google AI Studio before the demo (GEMINI_MODEL).
 */

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const PROMPT = `You read relocation documents for international students (offer letters, CAS letters, tenancy agreements, fee invoices, messages about payments).
Return ONLY JSON in this shape:
{
  "document_title": short name such as "Offer letter" or "Tenancy agreement",
  "pages": number of pages or null,
  "full_text": the document text, faithfully transcribed (max 4000 characters, keep any urgent or threatening wording),
  "items": [
    {
      "title": short name of the payment, e.g. "Tuition deposit",
      "payee": who must be paid,
      "amount": number without currency symbol,
      "currency": ISO 4217 code,
      "due_date": "YYYY-MM-DD" or null,
      "reference": payment reference or null,
      "kind": one of "tuition", "rent", "deposit", "fee", "other",
      "source_snippet": the exact sentence the payment came from,
      "bank": { "account_name", "iban", "bic", "sort_code", "account_number" } (null for anything not written)
    }
  ]
}
Only include payments the student must make. Never guess or invent values: use null when something isn't written. Copy account numbers character by character.`;

function sampleResult(kind: "fee" | "scam", filename?: string): ExtractionResult {
  const base = kind === "scam" ? SAMPLE_SCAM_MESSAGE : SAMPLE_FEE_INVOICE;
  return filename ? { ...base, filename } : base;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "read", message: "Send the file as form data." }, { status: 400 });
  }

  const sample = form.get("sample");
  if (sample === "fee" || sample === "scam") return NextResponse.json(sampleResult(sample));

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "read", message: "No file received." }, { status: 400 });
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: "type" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 413 });
  if (file.size === 0) return NextResponse.json({ error: "read", message: "The file is empty." }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json(sampleResult("fee", file.name));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: file.type, data } }, { text: PROMPT }] }],
      config: { responseMimeType: "application/json", temperature: 0 },
    });
    const raw = JSON.parse((response.text ?? "").replace(/^```(json)?|```$/g, "").trim()) as Record<string, unknown>;
    const items = normalizeItems(raw.items);
    if (!items.length) return NextResponse.json({ error: "none" }, { status: 422 });
    const result: ExtractionResult = {
      documentTitle: typeof raw.document_title === "string" && raw.document_title.trim() ? raw.document_title.trim().slice(0, 80) : "Document",
      filename: file.name,
      pages: typeof raw.pages === "number" && raw.pages > 0 ? Math.round(raw.pages) : null,
      readBy: "gemini",
      fullText: typeof raw.full_text === "string" ? raw.full_text.slice(0, 4000) : "",
      items,
    };
    return NextResponse.json(result);
  } catch (e) {
    console.error("Gemini extraction failed", e);
    return NextResponse.json({ error: "read", message: "The AI couldn't read this file." }, { status: 502 });
  }
}

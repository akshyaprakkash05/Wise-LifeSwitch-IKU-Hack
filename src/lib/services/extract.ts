import { GoogleGenAI } from "@google/genai";
import { ExtractionResponseSchema, type ExtractionResponse } from "../schemas";

/**
 * Document extraction with Gemini. Server-side only (called from /api/extract).
 * Gemini reads a PDF or photo and returns strict JSON; we validate it with zod
 * before anything reaches the roadmap.
 */

export class ExtractionError extends Error {
  constructor(
    public code: "no_key" | "unreadable" | "upstream",
    message: string,
  ) {
    super(message);
  }
}

/** JSON schema sent to Gemini. Mirrors ExtractedItemSchema in ../schemas. */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    document_type: { type: "string", description: "e.g. offer letter, CAS, tenancy agreement, fee invoice" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          payee: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string", enum: ["GBP", "INR", "EUR", "USD", "CAD", "AUD", "NGN", "CNY", "PKR", "BRL"] },
          due_date: { type: ["string", "null"], description: "YYYY-MM-DD, or null if the document gives no date" },
          reference: { type: ["string", "null"] },
          category: { type: "string", enum: ["tuition", "housing", "deposit", "visa", "living", "travel", "other"] },
          requirements: { type: "array", items: { type: "string" } },
          explanation: { type: "string" },
          missing_info: { type: "array", items: { type: "string" } },
          source_snippet: { type: "string" },
        },
        required: [
          "title", "payee", "amount", "currency", "due_date", "reference",
          "category", "requirements", "explanation", "missing_info", "source_snippet",
        ],
      },
    },
  },
  required: ["items"],
};

function prompt(ctx: { origin: string; destination: string; today: string }) {
  return `You read relocation documents for an international student moving from ${ctx.origin} to ${ctx.destination}. Today is ${ctx.today}.

Find every payment the student has to make in this document (fees, deposits, rent, instalments, visa or health charges).
For each payment return:
- title: short name a student understands, e.g. "Tuition deposit"
- payee: who receives the money
- amount and currency exactly as written (do not convert)
- due_date as YYYY-MM-DD. If the document gives a relative deadline (e.g. "within 14 days of acceptance") and no date, use null and explain in missing_info
- reference: the payment reference to quote, or null
- category
- requirements: conditions attached to paying (e.g. "UK guarantor required")
- explanation: one or two plain-English sentences explaining what this payment is, explaining any jargon (guarantor, CAS, IHS, deposit protection) as if to someone who has never moved abroad
- missing_info: anything the student needs but the document does not say (no reference, no bank details, unclear date), phrased as advice
- source_snippet: the exact sentence(s) from the document this came from, copied word for word

Only include payments that are actually in the document. Never invent amounts. If there are no payments, return an empty items array.`;
}

export async function extractPayments(
  file: { bytes: ArrayBuffer; mimeType: string },
  ctx: { origin: string; destination: string; today: string },
): Promise<ExtractionResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ExtractionError("no_key", "GEMINI_API_KEY is not set.");

  const ai = new GoogleGenAI({ apiKey });
  let text: string | undefined;
  try {
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: file.mimeType, data: Buffer.from(file.bytes).toString("base64") } },
            { text: prompt(ctx) },
          ],
        },
      ],
      config: { responseMimeType: "application/json", responseJsonSchema: RESPONSE_SCHEMA, temperature: 0 },
    });
    text = res.text;
  } catch (err) {
    console.error("[extract] Gemini call failed:", (err as Error).message);
    throw new ExtractionError("upstream", "Couldn't reach the document reader.");
  }

  let json: unknown;
  try {
    json = JSON.parse(text ?? "");
  } catch {
    throw new ExtractionError("unreadable", "The document reader returned something we couldn't understand.");
  }
  const parsed = ExtractionResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error("[extract] schema mismatch:", parsed.error.issues.slice(0, 3));
    throw new ExtractionError("unreadable", "The document reader returned payments in an unexpected shape.");
  }
  return parsed.data;
}

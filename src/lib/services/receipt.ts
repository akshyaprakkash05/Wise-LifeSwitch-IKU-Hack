import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { ExtractionError } from "./extract";

/** Reads a restaurant or shop receipt with Gemini. Server-side only. */

const ReceiptSchema = z.object({
  merchant: z.string().default("Receipt"),
  currency: z.string().length(3),
  lines: z.array(z.object({ name: z.string().min(1), amount: z.number().nonnegative() })),
  extras: z.number().nonnegative().default(0),
});
export type ScannedReceipt = z.infer<typeof ReceiptSchema>;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    merchant: { type: "string" },
    currency: { type: "string", description: "ISO 4217 code, e.g. GBP" },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, amount: { type: "number", description: "line total in major units, quantity applied" } },
        required: ["name", "amount"],
      },
    },
    extras: { type: "number", description: "service charge + tips + any tax not already in line prices, in major units" },
  },
  required: ["merchant", "currency", "lines", "extras"],
};

const PROMPT = `Read this receipt. Return every ordered item as a line with its line total (apply quantities: "2 x Chai 3.95" is one line "Chai x2" with amount 7.90).
Put service charge, optional tips and tax that is added on top of item prices into "extras". Do not include subtotal, total, payment or change lines.
Use the receipt's currency. If you cannot read a price, skip the line rather than guessing.`;

export async function scanReceipt(file: { bytes: ArrayBuffer; mimeType: string }): Promise<ScannedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ExtractionError("no_key", "GEMINI_API_KEY is not set.");
  const ai = new GoogleGenAI({ apiKey });
  let text: string | undefined;
  try {
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: [{ role: "user", parts: [
        { inlineData: { mimeType: file.mimeType, data: Buffer.from(file.bytes).toString("base64") } },
        { text: PROMPT },
      ] }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    text = res.text;
  } catch (err) {
    console.error("[receipt] Gemini call failed:", (err as Error).message);
    throw new ExtractionError("upstream", "Couldn't reach the receipt reader.");
  }
  try {
    const parsed = ReceiptSchema.parse(JSON.parse(text ?? ""));
    return { ...parsed, currency: parsed.currency.toUpperCase() };
  } catch {
    throw new ExtractionError("unreadable", "We couldn't read that receipt. Try a sharper, flatter photo.");
  }
}

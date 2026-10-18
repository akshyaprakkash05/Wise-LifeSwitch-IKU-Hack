import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextResponse } from "next/server";
import { parseMessage, type ReadMessage } from "@/lib/shield/parse";

/**
 * POST /api/shield/read  { text }
 * Reads who is asking for money and their bank details out of a pasted message.
 * Gemini when a key is set; plain patterns otherwise (and as a fallback if Gemini fails).
 * The risk decision itself is made by the rule-based checks in /api/scam-check, not by AI.
 */

const PROMPT = `This is a message someone received asking them to pay money. Return ONLY JSON:
{"payee": who wants to be paid or null, "amount": number or null, "currency": ISO 4217 code or null,
 "bank": {"account_name": string|null, "iban": string|null, "bic": string|null, "sort_code": string|null, "account_number": string|null}}
Copy bank details exactly, character by character. Use null for anything not written. Never guess.

Message:
`;

const str = (v: unknown, max = 80) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.slice(0, 5000) : "";
  if (!text.trim()) return NextResponse.json({ error: "empty", message: "Paste the message you received." }, { status: 400 });

  const fallback = parseMessage(text);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: PROMPT + text }] }],
      config: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
    });
    const raw = JSON.parse(res.text ?? "{}") as Record<string, unknown>;
    const bank = (raw.bank ?? {}) as Record<string, unknown>;
    const result: ReadMessage = {
      payee: str(raw.payee) ?? fallback.payee,
      amount: typeof raw.amount === "number" && raw.amount >= 0 ? raw.amount : fallback.amount,
      currency: str(raw.currency, 3)?.toUpperCase() ?? fallback.currency,
      bank: {
        account_name: str(bank.account_name) ?? fallback.bank.account_name,
        iban: str(bank.iban, 40)?.replace(/\s/g, "") ?? fallback.bank.iban,
        bic: str(bank.bic, 11) ?? fallback.bank.bic,
        sort_code: str(bank.sort_code, 10) ?? fallback.bank.sort_code,
        account_number: str(bank.account_number, 12) ?? fallback.bank.account_number,
      },
      fullText: text,
      readBy: "gemini",
    };
    return NextResponse.json(result);
  } catch (e) {
    console.error("Scam Shield read failed, using patterns", (e as Error).message);
    return NextResponse.json(fallback);
  }
}

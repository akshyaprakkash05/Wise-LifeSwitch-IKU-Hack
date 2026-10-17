import { z } from "zod";

/**
 * Runtime validation for the Gemini extraction contract.
 * Doc AI (Anusha): validate model output with `ExtractionResponseSchema.safeParse`
 * before anything reaches the roadmap. Invalid items should surface as a
 * friendly "we couldn't read this" state, never a crash.
 */

export const CurrencySchema = z.enum([
  "GBP", "INR", "EUR", "USD", "CAD", "AUD", "NGN", "CNY", "PKR", "BRL",
]);

export const CategorySchema = z.enum([
  "tuition", "housing", "deposit", "visa", "living", "travel", "other",
]);

export const ExtractedItemSchema = z.object({
  title: z.string().min(1),
  payee: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: CurrencySchema,
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be YYYY-MM-DD")
    .nullable(),
  reference: z.string().nullable(),
  category: CategorySchema,
  requirements: z.array(z.string()).default([]),
  explanation: z.string().default(""),
  missing_info: z.array(z.string()).default([]),
  source_snippet: z.string().default(""),
});

export const ExtractionResponseSchema = z.object({
  document_type: z.string().optional(),
  items: z.array(ExtractedItemSchema),
});

export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

// Turns what the student approved on the review screen into roadmap items the rest of the app understands.

import { GLOSSARY_TERMS } from "./glossary-terms";
import type { RoadmapItem } from "@/lib/types";
import { longDate } from "./dates";
import type { ExtractedItem } from "./types";

function shortName(payee: string): string {
  const skip = /^(the|student|living|ltd|limited|lettings|fees|office)$/i;
  return payee.split(/\s+/).find((w) => !skip.test(w)) ?? payee;
}

function lastDigits(item: ExtractedItem): string {
  const raw = (item.bank?.account_number || item.bank?.iban || "").replace(/\s/g, "");
  return raw ? `•• ${raw.slice(-4)}` : "••";
}

export function toRoadmapItems(items: ExtractedItem[], uploadId: string, docTitle: string, fullText: string): RoadmapItem[] {
  return items
    .filter((i) => i.amount !== null && i.due_date && i.payee)
    .map((i, n) => {
      const snippet = i.source_snippet ?? "";
      return {
        id: `${uploadId}-${n}`,
        title: i.title,
        payee: i.payee!,
        payeeShort: shortName(i.payee!),
        account: lastDigits(i),
        amountGbp: i.amount!,
        due: i.due_date!,
        dueLabel: longDate(i.due_date!),
        doc: "invoice",
        reference: i.reference ?? "",
        repeat: "One-off",
        note: `From ${docTitle.toLowerCase()}`,
        sourceSnippet: snippet,
        terms: GLOSSARY_TERMS.filter((t) => snippet.toLowerCase().includes(t.toLowerCase())),
        category: i.kind === "rent" || i.kind === "deposit" ? "Housing" : "Tuition",
        ready: !!i.reference,
        flag: i.reference ? undefined : "missing-reference",
        bank: i.bank ?? undefined,
        sourceText: fullText,
        uploadId,
      } satisfies RoadmapItem;
    });
}

"use client";

import { useCallback } from "react";
import { sht, type ShieldKey } from "@/lib/shield/strings";
import { useApp } from "@/state/app-state";

/** Translator for the Scam Shield page, in the language picked in the top bar. */
export function useSHT() {
  const { state } = useApp();
  return useCallback((key: ShieldKey, vars?: Record<string, string | number>) => sht(state.lang, key, vars), [state.lang]);
}

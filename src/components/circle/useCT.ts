"use client";

import { useCallback } from "react";
import { ct, type CircleKey } from "@/lib/circle/strings";
import { useApp } from "@/state/app-state";

/** Translator for the Circle screens, in the language picked in the top bar. */
export function useCT() {
  const { state } = useApp();
  return useCallback((key: CircleKey, vars?: Record<string, string | number>) => ct(state.lang, key, vars), [state.lang]);
}

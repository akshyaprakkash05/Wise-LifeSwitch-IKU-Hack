"use client";

import { useCallback } from "react";
import { st, type SplitKey } from "@/lib/split-ui/strings";
import { useApp } from "@/state/app-state";

/** Translator for the Group Split screens, in the language picked in the top bar. */
export function useST() {
  const { state } = useApp();
  return useCallback((key: SplitKey, vars?: Record<string, string | number>) => st(state.lang, key, vars), [state.lang]);
}

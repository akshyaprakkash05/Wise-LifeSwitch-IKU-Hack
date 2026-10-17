"use client";

import { useCallback } from "react";
import { tt, type TabKey } from "@/lib/tabs/strings";
import { useApp } from "@/state/app-state";

/** Translator for the Documents, Payments and Reminders tabs, in the language picked in the top bar. */
export function useT() {
  const { state } = useApp();
  return useCallback((key: TabKey, vars?: Record<string, string | number>) => tt(state.lang, key, vars), [state.lang]);
}

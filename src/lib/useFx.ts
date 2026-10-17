"use client";

import { useEffect, useState } from "react";
import type { CurrencyCode } from "./types";
import { fallbackRate } from "./services/fx";

export interface FxState {
  rate: number;
  source: "live" | "fallback";
  loading: boolean;
}

/** Live rate from /api/fx, starting from the fallback so the UI never shows a blank. */
export function useFx(from?: CurrencyCode, to?: CurrencyCode): FxState {
  const [fx, setFx] = useState<FxState>(() => ({
    rate: from && to ? fallbackRate(from, to) : 1,
    source: "fallback",
    loading: true,
  }));

  useEffect(() => {
    if (!from || !to) return;
    const ctrl = new AbortController();
    setFx({ rate: fallbackRate(from, to), source: "fallback", loading: true });
    fetch(`/api/fx?from=${from}&to=${to}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { rate: number; source: "live" | "fallback" }) => setFx({ rate: j.rate, source: j.source, loading: false }))
      .catch(() => {
        if (!ctrl.signal.aborted) setFx((f) => ({ ...f, loading: false }));
      });
    return () => ctrl.abort();
  }, [from, to]);

  return fx;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { CircleFeed } from "./server/circle";

/**
 * Browser side of LifeSwitch Circle. This device remembers which Circle it
 * belongs to (code + member id) in localStorage; the feed lives in Postgres
 * and is polled every few seconds, which is plenty for chat on stage.
 */

export type Membership = { code: string; memberId: string };
export type { CircleFeed };

const KEY = "lifeswitch:circle";
const POLL_MS = 2500;

export function getMembership(): Membership | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Membership) : null;
  } catch {
    return null;
  }
}

export function saveMembership(m: Membership | null) {
  try {
    if (m) localStorage.setItem(KEY, JSON.stringify(m));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: membership lasts for this visit only */
  }
}

export function useMembership() {
  const [m, setM] = useState<Membership | null | undefined>(undefined);
  useEffect(() => setM(getMembership()), []);
  const update = useCallback((next: Membership | null) => {
    saveMembership(next);
    setM(next);
  }, []);
  return [m, update] as const;
}

export class CircleApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new CircleApiError(json.error ?? "server", json.message ?? "Something went wrong.");
  return json as T;
}

type Person = { name: string; relation: string; phone?: string | null };

export const circleApi = {
  create: (p: Person) => call<Membership>("/api/circle", { method: "POST", body: JSON.stringify(p) }),
  join: (code: string, p: Person) => call<Membership>(`/api/circle/${code}/join`, { method: "POST", body: JSON.stringify(p) }),
  feed: (code: string) => call<CircleFeed>(`/api/circle/${code}`, { cache: "no-store" }),
  say: (m: Membership, body: string) =>
    call(`/api/circle/${m.code}/messages`, { method: "POST", body: JSON.stringify({ memberId: m.memberId, body }) }),
  activity: (m: Membership, kind: "payment" | "milestone" | "checkin" | "location", text: string) =>
    call(`/api/circle/${m.code}/activity`, { method: "POST", body: JSON.stringify({ memberId: m.memberId, kind, text }) }),
  update: (m: Membership, patch: { sharing?: boolean; last_place?: string }) =>
    call(`/api/circle/${m.code}/members`, { method: "PATCH", body: JSON.stringify({ memberId: m.memberId, ...patch }) }),
};

/** Tell the Circle about something, if this device is in one. Never throws: the Circle is a bonus, not a blocker. */
export async function shareToCircle(kind: "payment" | "milestone" | "location", text: string) {
  const m = getMembership();
  if (!m) return;
  try {
    await circleApi.activity(m, kind, text);
  } catch (err) {
    console.warn("[circle] couldn't share activity:", (err as Error).message);
  }
}

/** Live feed for a Circle: polls while the tab is visible. */
export function useCircleFeed(code: string | undefined) {
  const [feed, setFeed] = useState<CircleFeed | null>(null);
  const [error, setError] = useState<CircleApiError | null>(null);

  const refresh = useCallback(async () => {
    if (!code) return;
    try {
      setFeed(await circleApi.feed(code));
      setError(null);
    } catch (err) {
      setError(err instanceof CircleApiError ? err : new CircleApiError("server", "Couldn't load the Circle."));
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [code, refresh]);

  return { feed, error, refresh };
}

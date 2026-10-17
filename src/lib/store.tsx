"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Activity, CircleMember, ExtractedItem, MoveProfile, RoadmapItem } from "./types";
import { PRIYA_ACTIVITY, PRIYA_CIRCLE, PRIYA_PROFILE, priyaRoadmap } from "./demo/priya";

/**
 * App state for the whole journey.
 * Persists to localStorage so the demo survives refreshes with no backend.
 * When Supabase is ready, keep this API and swap the load/save internals
 * (or sync from here) so feature code doesn't change.
 */

interface State {
  profile: MoveProfile | null;
  items: RoadmapItem[];
  circle: CircleMember[];
  activity: Activity[];
}

interface Store extends State {
  /** false until state has loaded from storage (avoids hydration flashes) */
  ready: boolean;
  setProfile: (p: MoveProfile) => void;
  loadDemo: () => void;
  reset: () => void;
  /** Adds AI-extracted items. Pass reviewed: true once the user has checked them on the review screen. */
  addExtracted: (items: ExtractedItem[], doc: { id: string; name: string }, opts?: { reviewed?: boolean }) => RoadmapItem[];
  updateItem: (id: string, patch: Partial<RoadmapItem>) => void;
  removeItem: (id: string) => void;
  markPaid: (id: string) => void;
  addActivity: (a: Omit<Activity, "id" | "at"> & { at?: string }) => void;
}

const KEY = "lifeswitch:v1";
const EMPTY: State = { profile: null, items: [], circle: [], activity: [] };
const Ctx = createContext<Store | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* storage blocked or corrupt: start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode: state still works in memory */
    }
  }, [state, ready]);

  const setProfile = useCallback((profile: MoveProfile) => {
    setState((s) => ({
      ...s,
      profile,
      circle: s.circle.length
        ? s.circle
        : [{ id: "me", name: profile.name, relation: "You", initials: profile.name.slice(0, 1).toUpperCase(), sharing: true }],
    }));
  }, []);

  const loadDemo = useCallback(() => {
    setState({ profile: { ...PRIYA_PROFILE, createdAt: new Date().toISOString() }, items: priyaRoadmap(), circle: PRIYA_CIRCLE, activity: PRIYA_ACTIVITY });
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const addExtracted = useCallback((extracted: ExtractedItem[], doc: { id: string; name: string }, opts?: { reviewed?: boolean }) => {
    const created: RoadmapItem[] = extracted.map((e) => ({
      ...e,
      id: uid(),
      document_id: doc.id,
      document_name: doc.name,
      status: "todo",
      reviewed: opts?.reviewed ?? false,
      recurring: e.category === "housing" && /month/i.test(e.source_snippet) ? "monthly" : null,
    }));
    setState((s) => ({ ...s, items: [...s.items, ...created] }));
    return created;
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<RoadmapItem>) => {
    setState((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
  }, []);

  const addActivity = useCallback((a: Omit<Activity, "id" | "at"> & { at?: string }) => {
    setState((s) => ({ ...s, activity: [{ id: uid(), at: a.at ?? new Date().toISOString(), ...a }, ...s.activity] }));
  }, []);

  const markPaid = useCallback((id: string) => {
    setState((s) => {
      const item = s.items.find((i) => i.id === id);
      if (!item) return s;
      const me = s.circle[0];
      const sharing = me?.sharing ?? false;
      return {
        ...s,
        items: s.items.map((i) => (i.id === id ? { ...i, status: "paid", paid_at: new Date().toISOString() } : i)),
        activity: sharing
          ? [{ id: uid(), memberId: me.id, text: `Paid: ${item.title}`, at: new Date().toISOString(), kind: "payment" }, ...s.activity]
          : s.activity,
      };
    });
  }, []);

  const value = useMemo<Store>(
    () => ({ ...state, ready, setProfile, loadDemo, reset, addExtracted, updateItem, removeItem, markPaid, addActivity }),
    [state, ready, setProfile, loadDemo, reset, addExtracted, updateItem, removeItem, markPaid, addActivity],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

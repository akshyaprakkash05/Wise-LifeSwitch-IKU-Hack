"use client";

import { useApp } from "@/state/app-state";
import { Icon } from "./Icon";

export function Toast() {
  const { state } = useApp();
  if (!state.toast) return null;
  return (
    <div className="toast" role="status">
      <span className="tick">
        <Icon name="check" size={14} stroke={3} />
      </span>
      <span>{state.toast}</span>
    </div>
  );
}

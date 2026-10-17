"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Accessible modal: focus moves in on open, Escape and backdrop click close it. */
export function Dialog({
  labelledBy,
  onClose,
  children,
  style,
}: {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, input, [href]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={style}>
        {children}
      </div>
    </div>
  );
}

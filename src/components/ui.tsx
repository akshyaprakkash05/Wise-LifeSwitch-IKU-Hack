import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* Small shared UI kit. Prefer these over one-off styles so screens stay consistent. */

type Variant = "primary" | "secondary" | "ghost" | "danger";
const btn: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-95",
  secondary: "bg-forest text-white hover:brightness-110",
  ghost: "bg-transparent text-ink border border-line hover:bg-sunk",
  danger: "bg-bad text-white hover:brightness-110",
};
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.95rem] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed min-h-11";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={clsx(btnBase, btn[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={clsx(btnBase, btn[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("rounded-[var(--radius-card)] border border-line bg-surface p-5", className)} {...props} />;
}

type Tone = "good" | "warn" | "bad" | "idle" | "accent";
const tones: Record<Tone, string> = {
  good: "bg-good-bg text-good",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  idle: "bg-idle-bg text-idle",
  accent: "bg-accent text-accent-ink",
};

export function Pill({ tone = "idle", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("font-mono text-[0.72rem] uppercase tracking-[0.08em] text-muted", className)}>{children}</p>;
}

export function PageHeader({ eyebrow, title, lead, action }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {lead && <p className="max-w-[60ch] text-muted">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

export function Avatar({ initials, tone = "accent", size = 32 }: { initials: string; tone?: "accent" | "forest"; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={clsx(
        "inline-grid shrink-0 place-items-center rounded-full text-xs font-bold",
        tone === "accent" ? "bg-accent text-accent-ink" : "bg-forest text-white",
      )}
    >
      {initials}
    </span>
  );
}

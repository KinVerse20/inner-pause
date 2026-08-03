"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { chakras, chakraMap } from "@/data/chakras";
import type { ChakraId } from "@/lib/types";

export function AppPageHeader({
  title,
  copy,
  backHref,
  right,
}: {
  title?: string;
  copy?: string;
  backHref?: string;
  right?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
      {backHref ? (
        <Link href={backHref} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--ip-border)] bg-white/78 text-[var(--ip-purple)] shadow-sm" aria-label="Back">
          ‹
        </Link>
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--ip-border)] bg-white/60 text-[var(--ip-muted)]" aria-hidden="true">
          ☰
        </span>
      )}
      <div className="min-w-0 text-center">
        {title ? <h1 className="truncate font-serif text-xl text-[var(--ip-ink)]">{title}</h1> : <CompactLotus />}
        {copy ? <p className="mt-0.5 truncate text-xs text-[var(--ip-muted)]">{copy}</p> : null}
      </div>
      {right ?? (
        <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-full border border-[var(--ip-border)] bg-white/78 text-[var(--ip-purple)] shadow-sm" aria-label="Open profile">
          ♙
        </Link>
      )}
    </header>
  );
}

export function CompactLotus() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[var(--ip-ink)]">
      <span className="text-xl text-[var(--ip-purple)]">♧</span>
      <span className="font-semibold">The Inner Pause</span>
    </div>
  );
}

export function ChakraPath({
  active = [],
  compact = false,
  labels = false,
}: {
  active?: ChakraId[];
  compact?: boolean;
  labels?: boolean;
}) {
  const activeSet = new Set(active);
  return (
    <div className={`relative mx-auto flex ${compact ? "h-36" : "h-48"} w-full max-w-[12rem] justify-center`}>
      <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--ip-border-strong)] to-transparent" />
      <div className="absolute inset-y-4 left-1/2 flex -translate-x-1/2 flex-col justify-between">
        {chakras.slice().reverse().map((chakra) => {
          const selected = activeSet.size === 0 || activeSet.has(chakra.id);
          return (
            <span
              key={chakra.id}
              className={`relative grid rounded-full border bg-white transition ${compact ? "h-4 w-4" : "h-5 w-5"} ${selected ? "scale-110 opacity-100" : "opacity-45"}`}
              style={{ borderColor: chakra.accent, boxShadow: selected ? `0 0 18px ${chakra.glow}` : undefined }}
              aria-label={chakra.name}
            >
              <span className="m-auto h-2 w-2 rounded-full" style={{ backgroundColor: chakra.color }} />
            </span>
          );
        })}
      </div>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(123,77,255,0.18),transparent_58%)] blur-sm" />
      {labels ? (
        <div className="pointer-events-none absolute inset-y-2 right-0 flex flex-col justify-between text-[0.62rem] text-[var(--ip-muted)]">
          {chakras.slice().reverse().map((chakra) => <span key={chakra.id}>{chakra.name.replace(" Chakra", "")}</span>)}
        </div>
      ) : null}
    </div>
  );
}

export function ChakraBadge({ chakraId, className = "" }: { chakraId: ChakraId; className?: string }) {
  const chakra = chakraMap[chakraId];
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border bg-white ${className}`} style={{ borderColor: chakra.accent, color: chakra.color }}>
      <ChakraGlyph chakraId={chakraId} className="h-6 w-6" />
    </span>
  );
}

export function ExpandableCard({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[1.2rem] border border-[var(--ip-border)] bg-white/80 shadow-[0_12px_30px_rgba(108,62,244,0.08)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block font-semibold text-[var(--ip-ink)]">{title}</span>
          {summary ? <span className="mt-0.5 block truncate text-sm text-[var(--ip-muted)]">{summary}</span> : null}
        </span>
        <span className={`shrink-0 text-xl text-[var(--ip-purple)] transition ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open ? <div className="border-t border-[var(--ip-border)] px-4 pb-4 pt-3 text-sm leading-5 text-[var(--ip-body)]">{children}</div> : null}
    </section>
  );
}

export function InsightProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--ip-ink)]">{label}</span>
        <span className="text-[var(--ip-muted)]">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--ip-lavender)]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

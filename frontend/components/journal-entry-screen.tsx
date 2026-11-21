"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ExpressionPanel } from "@/components/expression-panel";
import { MvpShell } from "@/components/mvp-shell";

export function JournalEntryScreen() {
  const router = useRouter();
  const mode = useSearchParams().get("mode") === "write" ? "write" : "speak";

  return (
    <MvpShell>
      <div className="expression-page-shell">
        <header className="expression-route-toolbar">
          <button type="button" onClick={() => router.push("/")} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-[var(--gold-light)]" aria-label="Back">‹</button>
          <span className="minimal-label text-[0.62rem]">Release</span>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/10 bg-white/[0.035] px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--gold-light)] shadow-sm"
            aria-label="View Details"
            title="See your earlier reflections and completed sessions."
          >
            <span aria-hidden="true">◷</span>
            <span className="hidden sm:inline">History</span>
          </button>
        </header>

        <ExpressionPanel initialMode={mode} />
      </div>
    </MvpShell>
  );
}

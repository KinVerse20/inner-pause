"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ExpressionPanel } from "@/components/expression-panel";
import { MvpShell } from "@/components/mvp-shell";

export function JournalEntryScreen() {
  const router = useRouter();
  const mode = useSearchParams().get("mode") === "write" ? "write" : "speak";

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => router.push("/")} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/68 text-[var(--gold-light)]" aria-label="Back">‹</button>
          <div className="text-center">
            <h1 className="font-serif text-xl text-[var(--ip-ink)]">{mode === "write" ? "Journal" : "Express"}</h1>
            <p className="text-xs text-[var(--ip-muted)]">{mode === "write" ? "Release gently" : "Speak freely"}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--gold-border-soft)] bg-white/68 px-3 text-xs font-semibold text-[var(--gold-light)] shadow-sm"
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

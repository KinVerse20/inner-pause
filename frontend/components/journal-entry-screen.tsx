"use client";

import { useRouter } from "next/navigation";

import { ExpressionPanel } from "@/components/expression-panel";
import { MvpShell } from "@/components/mvp-shell";

export function JournalEntryScreen() {
  const router = useRouter();

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => router.push("/")} className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/70 text-[#a99ac8]" aria-label="Back">‹</button>
          <div className="text-center">
            <h1 className="font-serif text-xl text-[#322d42]">Journal</h1>
            <p className="text-xs text-[#90879d]">Release gently</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/70 bg-white/70 px-3 text-xs font-semibold text-[#a99ac8] shadow-sm"
            aria-label="View Details"
            title="See your earlier reflections and completed sessions."
          >
            <span aria-hidden="true">◷</span>
            <span className="hidden sm:inline">History</span>
          </button>
        </header>

        <ExpressionPanel />
      </div>
    </MvpShell>
  );
}

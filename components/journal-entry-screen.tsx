"use client";

import { useRouter } from "next/navigation";

import { ExpressionPanel } from "@/components/expression-panel";
import { GlassCard, MvpShell } from "@/components/mvp-shell";

export function JournalEntryScreen() {
  const router = useRouter();

  return (
    <MvpShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="grid h-11 w-11 place-items-center rounded-full border border-purple-200 bg-white/70 text-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
            aria-label="Back"
          >
            ←
          </button>
          <div className="min-w-0 text-center">
            <p className="font-serif text-xl text-[#130b4f]">Express</p>
            <p className="text-xs text-[#6d5ea8]">Share freely. Be honest. Be kind.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-purple-200 bg-white/70 px-3 text-xs font-medium text-[#6d28d9] transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] sm:text-sm"
            aria-label="View history"
            title="See your earlier reflections and completed sessions."
          >
            <span aria-hidden="true">◷</span>
            <span>View History</span>
          </button>
        </header>

        <GlassCard className="p-4 text-center">
          <h1 className="font-serif text-3xl text-[#130b4f]">How are you feeling today?</h1>
          <p className="mt-2 text-sm text-[#4b3f86]">Write or speak. You can edit everything before continuing.</p>
        </GlassCard>

        <ExpressionPanel />
      </div>
    </MvpShell>
  );
}

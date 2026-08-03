"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { BrandLogo, GlassCard, MvpShell } from "@/components/mvp-shell";
import { ExpressionPanel } from "@/components/expression-panel";
import { useMvpState } from "@/lib/use-mvp-state";

const steps = [
  "Understand what you are feeling",
  "Create relief for right now",
  "Notice patterns over time",
];

export function MvpHomeScreen() {
  const router = useRouter();
  const state = useMvpState();
  const latest = state.entries.find((entry) => entry.analysis);
  const recentPlan = state.entries.find((entry) => entry.plan && entry.plan.status !== "completed")?.plan;
  const savedEntries = state.entries.filter((entry) => !entry.isTemporary);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = state.profile.fullName?.split(" ")[0] || "Sahil";

  return (
    <MvpShell>
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo compact />
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="grid h-11 w-11 place-items-center rounded-full border border-purple-200 bg-white/70 text-[#6d28d9] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
            aria-label="Open profile"
          >
            ♙
          </button>
        </header>

        <section className="rounded-[1.75rem] border border-purple-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(245,239,255,0.78),rgba(255,238,245,0.7))] p-5 text-center shadow-[0_22px_60px_rgba(88,28,135,0.12)]">
          <p className="text-sm text-[#6d5ea8]" suppressHydrationWarning>{greeting}, {firstName}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-[#130b4f] sm:text-5xl">What is weighing on you right now?</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#4b3f86]">
            Share what is happening. We will help you understand it and prepare a personalised reset.
          </p>
        </section>

        <ExpressionPanel compact />

        <div className="grid gap-2 sm:grid-cols-3">
          {steps.map((step, index) => (
            <GlassCard key={step} className="flex items-center gap-3 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-purple-100 text-sm font-semibold text-[#6d28d9]">{index + 1}</span>
              <p className="text-sm font-medium text-[#26156f]">{step}</p>
            </GlassCard>
          ))}
        </div>

        {recentPlan || latest || savedEntries.length ? (
          <section className="grid gap-2 sm:grid-cols-3">
            {recentPlan ? (
              <GlassCard className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7c3aed]">Continue Your Reset</p>
                <h2 className="mt-2 font-serif text-xl text-[#130b4f]">{recentPlan.title}</h2>
                <Link href={`/healing?entry=${recentPlan.journalEntryId}`} className="mt-3 inline-flex text-sm font-semibold text-[#6d28d9]">Open reset →</Link>
              </GlassCard>
            ) : null}
            {latest?.analysis ? (
              <GlassCard className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7c3aed]">Today&apos;s Reflection</p>
                <p className="mt-2 line-clamp-3 text-sm leading-5 text-[#4b3f86]">{latest.analysis.understandingSummary ?? latest.analysis.summary}</p>
                <Link href={`/analysis?entry=${latest.id}`} className="mt-3 inline-flex text-sm font-semibold text-[#6d28d9]">Review →</Link>
              </GlassCard>
            ) : null}
            {savedEntries.length >= 3 ? (
              <GlassCard className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7c3aed]">Patterns We Noticed</p>
                <p className="mt-2 text-sm leading-5 text-[#4b3f86]">Your saved reflections are beginning to show useful themes.</p>
                <Link href="/insights" className="mt-3 inline-flex text-sm font-semibold text-[#6d28d9]">View insights →</Link>
              </GlassCard>
            ) : null}
          </section>
        ) : (
          <GlassCard className="p-4 text-center">
            <p className="font-serif text-xl text-[#130b4f]">Start with one honest sentence.</p>
            <p className="mt-2 text-sm leading-5 text-[#4b3f86]">Nothing is saved to your journey until you choose to keep it.</p>
          </GlassCard>
        )}
      </div>
    </MvpShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { savePlan } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const durationOptions: Array<number | "full"> = [5, 10, 20, 30, "full"];

export function HealingPlanScreen() {
  const router = useRouter();
  const entryId = useSearchParams().get("entry");
  const state = useMvpState();
  const entry = useMemo(() => {
    if (entryId) return state.entries.find((item) => item.id === entryId);
    return state.entries.find((item) => item.plan) ?? state.entries.find((item) => item.analysis);
  }, [entryId, state.entries]);
  const plan = entry?.plan;

  if (!entry?.analysis) {
    return (
      <MvpShell>
        <GlassCard className="mx-auto max-w-xl p-6">
          <h1 className="font-serif text-3xl text-[var(--gold-light)]">No healing plan yet</h1>
          <p className="mt-3 text-sm leading-6 text-stone-300">Create a journal entry and analysis to generate your first personalised plan.</p>
          <Link href="/journal" className="mt-5 inline-flex rounded-full border border-[var(--gold-border)] px-5 py-3 text-[var(--gold-light)]">Start Journal</Link>
        </GlassCard>
      </MvpShell>
    );
  }

  if (!plan) {
    return (
      <MvpShell hideNav>
        <GlassCard className="mx-auto max-w-xl p-6">
          <h1 className="font-serif text-3xl text-[var(--gold-light)]">Plan not created yet</h1>
          <p className="mt-3 text-sm leading-6 text-stone-300">Confirm the analysis to create your personalised healing plan.</p>
          <GoldButton className="mt-5" onClick={() => { savePlan(entry.id); router.refresh(); }}>Create Healing Plan</GoldButton>
        </GlassCard>
      </MvpShell>
    );
  }

  const regenerate = (duration: number | "full") => {
    savePlan(entry.id, duration);
    router.refresh();
  };

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Back">←</button>
          <div className="text-center">
            <p className="text-sm text-[var(--gold-muted)]">Your Healing Plan</p>
            <p className="text-xs text-stone-500">Personalised just for you</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04]">✧</span>
        </header>

        <div className="relative grid min-h-60 place-items-center overflow-hidden rounded-[2rem] border border-[var(--gold-border-soft)] bg-white/[0.04]">
          <div className="absolute inset-x-0 top-20 h-28 mvp-energy-wave" />
          <div className="mvp-meditator scale-90" />
        </div>

        <SectionTitle title={plan.title} copy={plan.intendedOutcome} />

        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--gold-muted)]">Total Duration</p>
            <p className="font-serif text-3xl text-[var(--gold-light)]">{plan.totalDurationMinutes} min</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {durationOptions.map((duration) => (
              <button
                key={`${duration}`}
                type="button"
                onClick={() => regenerate(duration)}
                className={`rounded-full border px-4 py-2 text-sm ${plan.selectedDuration === duration ? "border-[var(--gold-border)] bg-amber-300/10 text-[var(--gold-light)]" : "border-white/10 bg-white/[0.04] text-stone-300"}`}
              >
                {duration === "full" ? "Full recommended" : `${duration} min`}
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          {plan.blocks.map((block, index) => {
            const chakra = chakraMap[block.chakraId];
            return (
              <div key={block.id} className="relative pl-8">
                <div className="absolute bottom-[-1rem] left-[0.85rem] top-10 w-px bg-[var(--gold-border-soft)]" />
                <span className="absolute left-0 top-4 grid h-7 w-7 place-items-center rounded-full border border-[var(--gold-border)] bg-[#030711] text-xs text-[var(--gold-light)]">{index + 1}</span>
                <GlassCard className="p-4" style={{ boxShadow: `0 0 38px ${chakra.glow}` }}>
                  <div className="flex gap-4">
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border" style={{ borderColor: chakra.accent, color: chakra.accent }}>
                      <ChakraGlyph chakraId={chakra.id} className="h-10 w-10" />
                    </span>
                    <div>
                      <h2 className="font-serif text-2xl text-stone-100">{block.title}</h2>
                      <p className="mt-1 text-sm text-[var(--gold-muted)]">{chakra.name} Healing • {block.frequencyLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-300">{block.intention}</p>
                      <p className="mt-2 text-xs text-stone-500">{block.durationMinutes} min</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>

        <GlassCard className="p-5">
          <p className="font-serif text-2xl text-[var(--gold-light)]">Customisation</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-stone-300 sm:grid-cols-3">
            {["Duration", "Voice level", "Music style", "Affirmations", "Nature sounds", "Guidance frequency"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-center">{item}</span>
            ))}
          </div>
          <p className="mt-4 text-xs text-stone-500">You can customise anytime.</p>
        </GlassCard>

        <GoldButton className="w-full" onClick={() => router.push(`/healing/player?plan=${plan.id}`)}>
          Start Healing
        </GoldButton>
      </div>
    </MvpShell>
  );
}

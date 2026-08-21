"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AppPageHeader } from "@/components/chakra-path-ui";
import { GlassCard, MvpShell } from "@/components/mvp-shell";
import { getSuggestedCategory, pauseCategories } from "@/lib/pause-categories";
import { getPathCompletedCount, getPathStatus, practicePaths } from "@/lib/practice-paths";
import { useMvpState } from "@/lib/use-mvp-state";
import { useProgressStore } from "@/lib/use-progress-store";

function getGreeting(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function MvpHomeScreen() {
  const state = useMvpState();
  const progress = useProgressStore();
  const firstName = state.profile.fullName?.split(" ")[0] || "Sahil";
  const hour = useMemo(() => new Date().getHours(), []);

  const continuingPause = state.entries.find((entry) => entry.plan && entry.plan.status !== "completed");
  const continuingPauseCategory = continuingPause?.plan?.blocks[0]
    ? pauseCategories.find((category) => category.chakraId === continuingPause.plan?.blocks[0]?.chakraId)
    : undefined;

  const continuingPath = !continuingPause
    ? practicePaths.find((path) => getPathStatus(progress, path.id) === "in-progress")
    : undefined;

  const excludeFromSuggestion = continuingPauseCategory?.id;
  const suggested = useMemo(() => getSuggestedCategory(hour, excludeFromSuggestion), [hour, excludeFromSuggestion]);

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <AppPageHeader />

        <section className="rounded-[1.75rem] border border-[var(--ip-border)] bg-white/72 px-5 py-4 text-center shadow-[var(--ip-shadow-md)]">
          <p className="font-serif text-2xl leading-tight text-[var(--ip-ink)]">{getGreeting(hour)}, {firstName}</p>
          <p className="mt-1 text-sm text-[var(--ip-body)]">How are you feeling right now?</p>
        </section>

        <div className="grid grid-cols-3 gap-2.5">
          {pauseCategories.map((category) => (
            <Link
              key={category.id}
              href={`/pause/${category.id}`}
              className="ip-tile-gradient flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--ip-border)] p-2.5 text-center shadow-[var(--ip-shadow-sm)] transition active:scale-[0.98]"
              style={{ ["--ip-tile-color" as string]: `var(--ip-cat-${category.tone})` }}
            >
              <span className="ip-tile-icon grid h-9 w-9 place-items-center rounded-full text-base">●</span>
              <span className="text-xs font-semibold text-[var(--ip-ink)]">{category.label}</span>
            </Link>
          ))}
          <Link
            href="/journal"
            className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--ip-border)] bg-white/60 p-2.5 text-center transition active:scale-[0.98]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ip-lavender)] text-base text-[var(--ip-purple)]">···</span>
            <span className="text-xs font-semibold text-[var(--ip-ink)]">More</span>
          </Link>
        </div>

        {continuingPause?.plan ? (
          <div className="space-y-1.5">
            <p className="px-1 text-xs uppercase tracking-[0.2em] text-[var(--ip-muted)]">Continue your practice</p>
            <GlassCard tone={continuingPauseCategory?.tone} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg text-[var(--ip-ink)]">
                    {continuingPauseCategory ? `${continuingPauseCategory.label} Pause` : continuingPause.plan.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--ip-muted)]">Pick up where you left off</p>
                </div>
                <Link
                  href={`/healing/player?plan=${continuingPause.plan.id}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--ip-gold-border)] bg-[linear-gradient(135deg,var(--ip-gold-2),var(--ip-gold))] text-[#241b10] shadow-[var(--ip-shadow-md)]"
                  aria-label="Continue pause"
                >
                  <span aria-hidden="true">▶</span>
                </Link>
              </div>
            </GlassCard>
          </div>
        ) : continuingPath ? (
          <div className="space-y-1.5">
            <p className="px-1 text-xs uppercase tracking-[0.2em] text-[var(--ip-muted)]">Continue your practice</p>
            <Link href={`/practice/${continuingPath.id}`} className="block">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg text-[var(--ip-ink)]">{continuingPath.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--ip-muted)]">
                      Day {getPathCompletedCount(progress, continuingPath.id)} / {continuingPath.chakra.sessions.length}
                    </p>
                  </div>
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--ip-gold-border)] bg-[linear-gradient(135deg,var(--ip-gold-2),var(--ip-gold))] text-[#241b10] shadow-[var(--ip-shadow-md)]"
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                </div>
              </GlassCard>
            </Link>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <p className="px-1 text-xs uppercase tracking-[0.2em] text-[var(--ip-muted)]">Picked for you</p>
          <Link href={`/pause/${suggested.category.id}`} className="block">
            <GlassCard tone={suggested.category.tone} className="p-4">
              <p className="font-serif text-lg text-[var(--ip-ink)]">{suggested.category.label} Pause</p>
              <p className="mt-0.5 text-xs text-[var(--ip-muted)]">{suggested.reason}</p>
            </GlassCard>
          </Link>
        </div>
      </div>
    </MvpShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { MvpShell } from "@/components/mvp-shell";
import { RitualBackdrop, RitualOrb, RitualWeatherCard, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { chakraMap } from "@/data/chakras";
import { savePlan, saveReflectionToJourney } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";
import type { ChakraId } from "@/lib/types";

const fallbackSessions: Array<{ title: string; duration: number; intention: string; chakraId: ChakraId }> = [
  { title: "Release", duration: 8, intention: "Immediate relief", chakraId: "heart" },
  { title: "Breathe", duration: 10, intention: "Steady the nervous system", chakraId: "third-eye" },
  { title: "Restore", duration: 10, intention: "Return to balance", chakraId: "heart" },
  { title: "Integrate", duration: 20, intention: "Settle and carry forward", chakraId: "crown" },
];

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
        <RitualBackdrop tone="neutral" className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="relative z-10 mx-auto max-w-3xl space-y-5 text-center">
            <p className="minimal-label text-xs">Heal</p>
            <h1 className="font-serif text-[clamp(2.7rem,8vw,4.8rem)] leading-[0.95] text-[var(--ip-ink)]">
              Your healing space opens after reflection.
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-[var(--ip-body)]">
              Begin with Speak or Write, or move straight into a short relief session.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/journal?mode=speak" className="min-h-12 rounded-full border border-[rgba(244,122,34,0.55)] bg-[rgba(244,122,34,0.12)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)]">
                Speak first
              </Link>
              <Link href="/player?chakraId=heart&duration=20&mood=calm" className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">
                I just need relief
              </Link>
            </div>
          </div>
        </RitualBackdrop>
      </MvpShell>
    );
  }

  if (!plan) {
    savePlan(entry.id);
    return null;
  }

  const primaryBlock = plan.blocks[0];
  const primaryChakra = primaryBlock?.chakraId ? chakraMap[primaryBlock.chakraId] : chakraMap.heart;
  const tone = inferWeatherTone(
    `${entry.analysis.emotions.map((item) => item.name).join(" ")} ${entry.analysis.triggers.join(" ")} ${entry.analysis.summary}`,
  );
  const sessions = [
    {
      title: primaryBlock?.title ?? "Release",
      duration: primaryBlock?.durationMinutes ?? 20,
      intention: primaryBlock?.intention ?? primaryChakra.meaning.split(",")[0] ?? "Balance",
      chakraId: primaryChakra.id,
      planId: plan.id,
    },
    ...fallbackSessions.filter((session) => session.chakraId !== primaryChakra.id),
  ];

  return (
    <MvpShell>
      <div className="space-y-5">
        <RitualBackdrop tone={tone} className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:items-center">
            <div className="grid place-items-center">
              <RitualOrb stage="transform" tone={tone} intensity={0.9} label="Healing transformation orb" />
            </div>

            <div className="space-y-5">
              <p className="minimal-label text-xs">Heal</p>
              <h1 className="font-serif text-[clamp(2.7rem,8vw,4.8rem)] leading-[0.95] text-[var(--ip-ink)]">
                Your healing journey is ready.
              </h1>
              <p className="text-base leading-7 text-[var(--ip-body)]">
                {entry.analysis.healingApproachSummary ?? "Energy is gathering into a gentler sequence designed to help you release, breathe, restore, and integrate."}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <RitualWeatherCard
                  title="Primary centre"
                  line={`${primaryChakra.name} is leading this sequence through ${primaryChakra.frequencyLabel}.`}
                  tone={tone}
                />
                <RitualWeatherCard
                  title="Intended shift"
                  line={plan.intendedOutcome}
                  tone={tone}
                />
              </div>

              <div className="rounded-[1.45rem] border border-[rgba(244,122,34,0.24)] bg-[rgba(18,20,22,0.56)] p-4 sm:p-5">
                <p className="minimal-label text-[0.62rem]">Session opening</p>
                <h2 className="mt-2 font-serif text-3xl text-[var(--ip-ink)]">{sessions[0].title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">
                  {sessions[0].duration} min • {sessions[0].intention}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push(`/healing/player?plan=${plan.id}`)}
                  className="min-h-12 rounded-full border border-[rgba(244,122,34,0.55)] bg-[rgba(244,122,34,0.12)] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)]"
                >
                  Begin healing
                </button>
                <button
                  type="button"
                  onClick={() => saveReflectionToJourney(entry.id)}
                  className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]"
                >
                  Save to journey
                </button>
              </div>
            </div>
          </div>
        </RitualBackdrop>

        <div className="grid gap-3 lg:grid-cols-4">
          {sessions.slice(0, 4).map((session, index) => (
            <button
              key={`${session.title}-${session.chakraId}`}
              type="button"
              onClick={() => {
                if ("planId" in session && session.planId) router.push(`/healing/player?plan=${session.planId}`);
                else router.push(`/player?chakraId=${session.chakraId}&duration=${session.duration === 8 ? 10 : session.duration}`);
              }}
              className="obsidian-panel rounded-[1.35rem] p-4 text-left"
            >
              <p className="minimal-label text-[0.62rem]">Stage {index + 1}</p>
              <h3 className="mt-2 font-serif text-2xl text-[var(--ip-ink)]">{session.title}</h3>
              <p className="mt-2 text-sm text-[var(--ip-body)]">{session.duration} min</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{session.intention}</p>
            </button>
          ))}
        </div>
      </div>
    </MvpShell>
  );
}


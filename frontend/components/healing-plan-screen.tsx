"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { BlushCard } from "@/components/morning-blush-ui";
import { GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { savePlan, saveReflectionToJourney } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";
import type { ChakraId } from "@/lib/types";

const fallbackSessions: Array<{ title: string; duration: number; intention: string; chakraId: ChakraId }> = [
  { title: "Ground", duration: 8, intention: "Stability", chakraId: "root" },
  { title: "Calm", duration: 10, intention: "Ease", chakraId: "heart" },
  { title: "Focus", duration: 10, intention: "Clarity", chakraId: "third-eye" },
  { title: "Restore", duration: 20, intention: "Rest", chakraId: "crown" },
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <BlushCard className="flex min-h-[calc(100dvh-9rem)] flex-col justify-center p-6 text-center lg:min-h-[calc(100dvh-2.5rem)]">
            <p className="minimal-label text-xs">Healing</p>
            <h1 className="mt-3 text-[clamp(2.5rem,8vw,4.8rem)] font-medium leading-none text-[var(--ip-ink)]">Sessions</h1>
            <p className="mx-auto mt-3 max-w-sm text-base text-[var(--ip-body)]">Choose a compact sound reset or create one from a reflection.</p>
            <Link href="/journal" className="tap-ripple mx-auto mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(255,138,42,0.58)] bg-[rgba(244,122,34,0.12)] px-6 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--gold-light)]">
              Reflect
            </Link>
          </BlushCard>
          <SessionList sessions={fallbackSessions} onPlay={(session) => router.push(`/player?chakraId=${session.chakraId}&duration=${session.duration === 8 ? 10 : session.duration}`)} />
        </div>
      </MvpShell>
    );
  }

  if (!plan) {
    return (
      <MvpShell>
        <BlushCard className="p-5">
          <p className="minimal-label text-xs">Healing</p>
          <h1 className="mt-2 text-3xl text-[var(--ip-ink)]">Plan pending</h1>
          <p className="mt-2 text-base leading-6 text-[var(--ip-body)]">Confirm your reflection to create a reset.</p>
          <GoldButton className="mt-4" onClick={() => { savePlan(entry.id); router.refresh(); }}>Create</GoldButton>
        </BlushCard>
      </MvpShell>
    );
  }

  const primaryBlock = plan.blocks[0];
  const primaryChakra = primaryBlock?.chakraId ? chakraMap[primaryBlock.chakraId] : chakraMap.heart;
  const sessions = [
    {
      title: primaryBlock?.title?.split(" ")[0] ?? "Ground",
      duration: primaryBlock?.durationMinutes ?? 20,
      intention: primaryChakra.meaning.split(",")[0] ?? "Balance",
      chakraId: primaryChakra.id,
      planId: plan.id,
    },
    ...fallbackSessions.filter((session) => session.chakraId !== primaryChakra.id),
  ];

  return (
    <MvpShell>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <BlushCard className="flex min-h-[22rem] flex-col justify-between p-6 lg:min-h-[calc(100dvh-2.5rem)]">
          <div>
            <p className="minimal-label text-xs">Healing</p>
            <h1 className="mt-3 text-[clamp(2.6rem,7vw,5rem)] font-medium leading-none text-[var(--ip-ink)]">Sessions</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-[var(--ip-body)]">{entry.analysis.understandingSummary ?? entry.analysis.summary}</p>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/healing/player?plan=${plan.id}`)}
            className="tap-ripple mt-8 rounded-[1.35rem] border border-[rgba(255,138,42,0.55)] bg-[rgba(244,122,34,0.11)] p-5 text-left shadow-[0_0_34px_rgba(244,122,34,0.12)]"
          >
            <div className="flex items-center justify-between gap-4">
              <span>
                <span className="minimal-label block text-xs">Recommended</span>
                <span className="mt-2 block text-4xl text-[var(--ip-ink)]">{sessions[0].title}</span>
                <span className="mt-2 block text-base text-[var(--ip-body)]">{sessions[0].duration} min · {sessions[0].intention}</span>
              </span>
              <span className="grid h-14 w-14 place-items-center rounded-full border border-[rgba(255,138,42,0.55)] text-2xl text-[var(--gold-light)]">▶</span>
            </div>
          </button>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => saveReflectionToJourney(entry.id)} className="min-h-11 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">Save</button>
            <button type="button" onClick={() => router.push("/journal")} className="min-h-11 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">New</button>
          </div>
        </BlushCard>

        <SessionList
          sessions={sessions}
          onPlay={(session) => {
            if ("planId" in session && session.planId) router.push(`/healing/player?plan=${session.planId}`);
            else router.push(`/player?chakraId=${session.chakraId}&duration=${session.duration === 8 ? 10 : session.duration}`);
          }}
        />
      </div>
    </MvpShell>
  );
}

function SessionList({
  sessions,
  onPlay,
}: {
  sessions: Array<{ title: string; duration: number; intention: string; chakraId: ChakraId; planId?: string }>;
  onPlay: (session: { title: string; duration: number; intention: string; chakraId: ChakraId; planId?: string }) => void;
}) {
  return (
    <div className="grid gap-3">
      {sessions.map((session) => (
        <button key={`${session.title}-${session.chakraId}`} type="button" onClick={() => onPlay(session)} className="obsidian-panel tap-ripple flex min-h-24 items-center gap-4 rounded-[1.25rem] p-4 text-left">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(255,138,42,0.8)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-2xl text-[var(--ip-ink)]">{session.title}</span>
            <span className="mt-1 block text-base text-[var(--ip-body)]">{session.duration} min</span>
          </span>
          <span className="text-sm uppercase tracking-[0.22em] text-[var(--ip-muted)]">{session.intention}</span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[rgba(255,138,42,0.45)] text-[var(--gold-light)]">▶</span>
        </button>
      ))}
    </div>
  );
}

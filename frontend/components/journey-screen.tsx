"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BlushCard } from "@/components/morning-blush-ui";
import { MvpShell } from "@/components/mvp-shell";
import { chakras } from "@/data/chakras";
import { getSessionKey, isChakraUnlocked, isSessionUnlocked } from "@/lib/progress";
import { useProgressStore } from "@/lib/use-progress-store";
import type { ChakraDefinition, ChakraId, ProgressState, SessionDefinition } from "@/lib/types";

const visualOrder = [...chakras].reverse();

const sanskrit: Record<ChakraId, string> = {
  crown: "Sahasrara",
  "third-eye": "Ajna",
  throat: "Vishuddha",
  heart: "Anahata",
  "solar-plexus": "Manipura",
  sacral: "Svadhisthana",
  root: "Muladhara",
};

function currentChakraId(progress: ProgressState): ChakraId {
  const next = chakras.find((chakra) => {
    if (!isChakraUnlocked(progress, chakra.index)) return false;
    return chakra.sessions.some((session) => !progress.completedSessionKeys.includes(getSessionKey(chakra.id, session.id)));
  });
  return next?.id ?? "heart";
}

export function JourneyScreen({ focusedChakraId }: { focusedChakraId?: string }) {
  const progress = useProgressStore();
  const initial = chakras.some((chakra) => chakra.id === focusedChakraId) ? (focusedChakraId as ChakraId) : currentChakraId(progress);
  const [selectedChakraId, setSelectedChakraId] = useState<ChakraId>(initial);
  const selectedChakra = useMemo(() => chakras.find((chakra) => chakra.id === selectedChakraId) ?? chakras.find((chakra) => chakra.id === "heart") ?? chakras[0], [selectedChakraId]);
  const completedCount = selectedChakra.sessions.filter((session) => progress.completedSessionKeys.includes(getSessionKey(selectedChakra.id, session.id))).length;
  const selectedUnlockedForJourney = isChakraUnlocked(progress, selectedChakra.index);

  return (
    <MvpShell>
      <div className="space-y-4">
        <header className="text-center">
          <p className="minimal-label text-xs">Chakra</p>
          <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.6rem)] font-medium leading-tight text-[var(--ip-ink)]">Topology</h1>
          <p className="mx-auto mt-2 max-w-xl text-base text-[var(--ip-body)]">Browse all seven centres. Journey locks remain separate from this map.</p>
        </header>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(20rem,0.88fr)_minmax(24rem,1.12fr)] lg:items-start">
          <BlushCard className="p-4 sm:p-5">
            <div className="mb-3 text-center">
              <p className="minimal-label text-xs">Energy body</p>
              <p className="mt-2 text-sm text-[var(--ip-muted)]">Tap any node</p>
            </div>
            <div className="obsidian-chakra-body">
              <div className="obsidian-chakra-line" />
              {visualOrder.map((chakra, index) => {
                const active = chakra.id === selectedChakra.id;
                return (
                  <button
                    key={chakra.id}
                    type="button"
                    onClick={() => setSelectedChakraId(chakra.id)}
                    className={`obsidian-chakra-node ${active ? "obsidian-chakra-node--active" : ""}`}
                    style={{ top: `${10 + index * 13.25}%` }}
                    aria-pressed={active}
                    aria-label={`Open ${chakra.name}`}
                  >
                    <span className="relative z-10 text-xs font-semibold">{visualOrder.length - index}</span>
                  </button>
                );
              })}
            </div>
          </BlushCard>

          <div className="grid min-w-0 gap-3.5">
            <BlushCard className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="minimal-label text-xs">{sanskrit[selectedChakra.id]}</p>
                  <h2 className="mt-2 text-4xl font-medium leading-tight text-[var(--ip-ink)]">{selectedChakra.name}</h2>
                  <p className="mt-3 text-base leading-7 text-[var(--ip-body)]">{selectedChakra.meaning}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[rgba(255,138,42,0.38)] px-3 py-1 text-sm text-[var(--gold-light)]">{selectedChakra.frequencyLabel}</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Detail label="Association" value={selectedChakra.meaning.split(",")[0] ?? "Balance"} />
                <Detail label="Intention" value={selectedChakra.purpose} />
                <Detail label="Recommended" value={selectedChakra.sessions[Math.min(completedCount, 4)]?.name ?? "Sound reset"} />
                <Detail label="Journey" value={selectedUnlockedForJourney ? `${completedCount} of 5 complete` : "Available in map"} />
              </div>

              <Link href={`/player?chakraId=${selectedChakra.id}&duration=20`} className="tap-ripple mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[rgba(255,138,42,0.58)] bg-[rgba(244,122,34,0.12)] px-5 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--gold-light)] shadow-[0_0_26px_rgba(244,122,34,0.12)]">
                Balance
              </Link>
            </BlushCard>

            <div className="grid gap-2">
              {selectedChakra.sessions.map((session, index) => (
                <JourneySessionCard key={session.id} chakra={selectedChakra} session={session} progress={progress} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MvpShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="minimal-label text-[0.62rem]">{label}</p>
      <p className="mt-2 text-base leading-6 text-[var(--ip-body)]">{value}</p>
    </div>
  );
}

function JourneySessionCard({
  chakra,
  session,
  progress,
  index,
}: {
  chakra: ChakraDefinition;
  session: SessionDefinition;
  progress: ProgressState;
  index: number;
}) {
  const completed = progress.completedSessionKeys.includes(getSessionKey(chakra.id, session.id));
  const unlocked = isSessionUnlocked(progress, chakra, index);
  const content = (
    <div className={`tap-ripple flex items-center gap-3 rounded-[1.15rem] border p-3 ${unlocked ? "border-white/10 bg-white/[0.035]" : "border-white/[0.07] bg-white/[0.02]"}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[rgba(255,138,42,0.35)] text-sm font-semibold text-[var(--gold-light)]">{index + 1}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xl text-[var(--ip-ink)]">{session.name}</span>
        <span className="block truncate text-sm text-[var(--ip-body)]">{session.durationMinutes} min · {session.instructions}</span>
      </span>
      <span className="text-sm font-semibold text-[var(--gold-light)]">{completed ? "Done" : unlocked ? "Open" : "Locked"}</span>
    </div>
  );

  if (!unlocked) return <div>{content}</div>;
  return <Link href={`/session/${chakra.id}/${session.id}/setup`}>{content}</Link>;
}

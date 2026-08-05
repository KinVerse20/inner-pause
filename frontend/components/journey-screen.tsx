"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ChakraStonePath, BlushCard } from "@/components/morning-blush-ui";
import { MvpShell } from "@/components/mvp-shell";
import { chakras } from "@/data/chakras";
import { getSessionKey, isChakraUnlocked, isSessionUnlocked } from "@/lib/progress";
import { useProgressStore } from "@/lib/use-progress-store";
import type { ChakraDefinition, ChakraId, ProgressState, SessionDefinition } from "@/lib/types";

const stoneColors: Record<ChakraId, string> = {
  root: "#d98276",
  sacral: "#eca98f",
  "solar-plexus": "#f2c994",
  heart: "#d79bb8",
  throat: "#98b6d3",
  "third-eye": "#a99ac8",
  crown: "#c8afd3",
};

function currentChakraId(progress: ProgressState): ChakraId {
  const next = chakras.find((chakra) => {
    if (!isChakraUnlocked(progress, chakra.index)) return false;
    return chakra.sessions.some((session) => !progress.completedSessionKeys.includes(getSessionKey(chakra.id, session.id)));
  });
  return next?.id ?? "crown";
}

export function JourneyScreen({ focusedChakraId }: { focusedChakraId?: string }) {
  const progress = useProgressStore();
  const initial = chakras.some((chakra) => chakra.id === focusedChakraId) ? (focusedChakraId as ChakraId) : currentChakraId(progress);
  const [selectedChakraId, setSelectedChakraId] = useState<ChakraId>(initial);
  const [expandedId, setExpandedId] = useState<ChakraId | null>(initial);
  const selectedChakra = useMemo(() => chakras.find((chakra) => chakra.id === selectedChakraId) ?? chakras[0], [selectedChakraId]);
  const completedCount = selectedChakra.sessions.filter((session) => progress.completedSessionKeys.includes(getSessionKey(selectedChakra.id, session.id))).length;
  const selectedUnlocked = isChakraUnlocked(progress, selectedChakra.index);

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <header className="text-center">
          <p className="text-sm font-medium text-[#90879d]">Your Flow</p>
          <h1 className="mt-1 font-serif text-3xl text-[#322d42]">{selectedChakra.name}</h1>
          <p className="mt-1 text-sm text-[#6f687d]">Stage {selectedChakra.index + 1} · {completedCount} of 5 complete</p>
        </header>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(22rem,1.2fr)] lg:items-start">
          <BlushCard className="p-3 sm:p-4">
            <ChakraStonePath
              stones={chakras.map((chakra) => {
                const unlocked = isChakraUnlocked(progress, chakra.index);
                const complete = chakra.sessions.every((session) => progress.completedSessionKeys.includes(getSessionKey(chakra.id, session.id)));
                const current = chakra.id === currentChakraId(progress);
                return {
                  key: chakra.id,
                  label: chakra.name,
                  color: stoneColors[chakra.id],
                  completed: complete,
                  current,
                  locked: !unlocked,
                  onClick: () => {
                    if (!unlocked) return;
                    setSelectedChakraId(chakra.id);
                    setExpandedId((currentId) => (currentId === chakra.id ? null : chakra.id));
                  },
                };
              })}
            />
          </BlushCard>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5">
            <BlushCard className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#90879d]">Current chakra</p>
                  <h2 className="mt-1 font-serif text-2xl text-[#322d42]">{selectedChakra.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6f687d]">{selectedChakra.meaning}</p>
                </div>
                <span className="rounded-full bg-[#f2eaf5] px-3 py-1 text-xs font-semibold text-[#a99ac8]">{selectedUnlocked ? "Open" : "Locked"}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-gradient-to-r from-[#eca98f] to-[#d79bb8]" style={{ width: `${(completedCount / 5) * 100}%` }} />
              </div>
            </BlushCard>

            {expandedId === selectedChakra.id && selectedUnlocked ? (
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
                {selectedChakra.sessions.map((session, index) => (
                  <JourneySessionCard
                    key={session.id}
                    chakra={selectedChakra}
                    session={session}
                    progress={progress}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <button
                type="button"
                disabled={!selectedUnlocked}
                onClick={() => setExpandedId(selectedChakra.id)}
                className="min-h-12 w-full rounded-full border border-white/70 bg-white/70 px-4 text-sm font-semibold text-[#a77d97] shadow-[0_12px_30px_rgba(152,117,139,0.12)] disabled:opacity-50"
              >
                {selectedUnlocked ? "Open sessions" : "Complete earlier stages to unlock"}
              </button>
            )}
          </div>
        </div>
      </div>
    </MvpShell>
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
    <div className={`flex items-center gap-3 rounded-[1.25rem] border border-white/64 bg-white/64 p-3 shadow-[0_10px_26px_rgba(152,117,139,0.1)] ${unlocked ? "" : "opacity-48"}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff8f4] text-sm font-semibold text-[#d58e93]">{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-lg text-[#322d42]">{session.name}</span>
        <span className="block truncate text-sm text-[#6f687d]">{session.durationMinutes} min · {session.instructions}</span>
      </span>
      <span className="text-sm font-semibold text-[#a99ac8]">{completed ? "Done" : unlocked ? "Start" : "Locked"}</span>
    </div>
  );

  if (!unlocked) return <div>{content}</div>;
  return <Link href={`/session/${chakra.id}/${session.id}/setup`}>{content}</Link>;
}

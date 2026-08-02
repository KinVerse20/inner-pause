"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ChakraGlyph, MoodLineIcon } from "@/components/chakra-symbol";
import { chakras } from "@/data/chakras";
import { getSessionKey, isChakraUnlocked, isSessionUnlocked } from "@/lib/progress";
import { useProgressStore } from "@/lib/use-progress-store";
import { ChakraDefinition, ChakraId, ProgressState, SessionDefinition } from "@/lib/types";

const chakraNames: Record<ChakraId, string> = {
  root: "Muladhara",
  sacral: "Swadhisthana",
  "solar-plexus": "Manipura",
  heart: "Anahata",
  throat: "Vishuddha",
  "third-eye": "Ajna",
  crown: "Sahasrara",
};

const sessionMoodIcons = ["grounded", "calm", "focus", "emotionally-lighter", "positive"] as const;

export function JourneyScreen({ focusedChakraId }: { focusedChakraId?: string }) {
  const progress = useProgressStore();
  const [selectedChakraId, setSelectedChakraId] = useState<ChakraId>(
    chakras.some((chakra) => chakra.id === focusedChakraId) ? (focusedChakraId as ChakraId) : "root",
  );

  const selectedChakra = useMemo(
    () => chakras.find((chakra) => chakra.id === selectedChakraId) ?? chakras[0],
    [selectedChakraId],
  );

  return (
    <div className="relative overflow-hidden pb-4">
      <div className="star-field pointer-events-none absolute inset-0" />
      <header className="relative text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center text-amber-200">
          <ChakraGlyph chakraId="crown" className="h-12 w-12 drop-shadow-[0_0_18px_rgba(252,211,77,0.35)]" />
        </div>
        <h1 className="mt-2 font-serif text-4xl leading-none text-white sm:text-6xl">Chakra Healing</h1>
        <p className="mt-3 text-lg text-slate-300">Learn through guided healing sessions</p>
      </header>

      <div className="relative mt-8 grid gap-5 lg:grid-cols-[17rem_1fr]">
        <aside className="rounded-[1.75rem] border border-white/10 bg-slate-950/42 p-4 backdrop-blur-xl lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="flex max-w-full gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] lg:block lg:space-y-4 lg:overflow-visible lg:pb-0">
            {chakras.map((chakra) => {
              const unlocked = isChakraUnlocked(progress, chakra.index);
              const selected = chakra.id === selectedChakra.id;
              const completedCount = chakra.sessions.filter((session) =>
                progress.completedSessionKeys.includes(getSessionKey(chakra.id, session.id)),
              ).length;

              return (
                <button
                  key={chakra.id}
                  type="button"
                  onClick={() => setSelectedChakraId(chakra.id)}
                  className={`relative flex min-w-44 items-center gap-3 rounded-2xl border p-3 text-left transition lg:min-w-0 lg:w-full ${
                    selected ? "bg-white/8" : "bg-slate-950/30 hover:bg-white/5"
                  } ${unlocked ? "opacity-100" : "opacity-58"}`}
                  style={{
                    borderColor: selected ? `${chakra.accent}77` : "rgba(255,255,255,0.1)",
                    boxShadow: selected ? `0 0 28px ${chakra.color}25` : undefined,
                  }}
                >
                  <span
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full border"
                    style={{
                      borderColor: `${chakra.color}88`,
                      color: chakra.accent,
                      background: `radial-gradient(circle, ${chakra.color}33, rgba(15,23,42,0.65))`,
                    }}
                  >
                    <ChakraGlyph chakraId={chakra.id} className="h-9 w-9" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{chakra.name}</span>
                    <span className="mt-1 block text-xs" style={{ color: chakra.accent }}>
                      {chakraNames[chakra.id]}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">{completedCount} of 5</span>
                  </span>
                  {!unlocked ? (
                    <span className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs text-slate-300">
                      Lock
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <JourneyChakraPanel chakra={selectedChakra} progress={progress} />
      </div>
    </div>
  );
}

function JourneyChakraPanel({
  chakra,
  progress,
}: {
  chakra: ChakraDefinition;
  progress: ProgressState;
}) {
  const progressKeys = progress.completedSessionKeys;
  const chakraUnlocked = isChakraUnlocked(progress, chakra.index);
  const completedCount = chakra.sessions.filter((session) =>
    progressKeys.includes(getSessionKey(chakra.id, session.id)),
  ).length;
  const progressPercent = (completedCount / chakra.sessions.length) * 100;

  return (
    <section
      id={`journey-${chakra.id}`}
      className="overflow-hidden rounded-[1.75rem] border bg-slate-950/55 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl"
      style={{ borderColor: `${chakra.color}66` }}
    >
      <div
        className="relative min-h-52 overflow-hidden p-5 sm:p-6"
        style={{
          background: `linear-gradient(135deg, ${chakra.color}55, rgba(15,23,42,0.28)), radial-gradient(circle at 82% 30%, ${chakra.accent}33, transparent 28%)`,
        }}
      >
        <div className="absolute inset-0 opacity-40">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.82))]" />
        </div>
        <div className="relative grid gap-4 sm:grid-cols-[1fr_12rem] sm:items-center">
          <div>
            <p className="text-lg" style={{ color: chakra.accent }}>
              {chakraNames[chakra.id]}
            </p>
            <h2 className="mt-2 font-serif text-4xl text-white sm:text-5xl">{chakra.name}</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-100 sm:text-base sm:leading-8">{chakra.purpose}</p>
          </div>
          <div className="grid place-items-center text-white/90">
            <ChakraGlyph chakraId={chakra.id} className="h-28 w-28 drop-shadow-[0_0_28px_rgba(255,255,255,0.18)] sm:h-36 sm:w-36" />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-base text-slate-200">
            <span className="font-semibold text-white">{completedCount}</span> of{" "}
            <span className="font-semibold text-white">5</span> completed
          </p>
          <p className="text-sm" style={{ color: chakra.accent }}>
            {chakraUnlocked ? "Journey available" : "Locked"}
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${chakra.color}, ${chakra.accent})`,
            }}
          />
        </div>

        <div className="mt-6 grid gap-3">
          {chakra.sessions.map((session, index) => (
            <JourneySessionCard
              key={session.id}
              chakra={chakra}
              session={session}
              completed={progressKeys.includes(getSessionKey(chakra.id, session.id))}
              unlocked={isSessionUnlocked(progress, chakra, index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneySessionCard({
  chakra,
  session,
  completed,
  unlocked,
  index,
}: {
  chakra: ChakraDefinition;
  session: SessionDefinition;
  completed: boolean;
  unlocked: boolean;
  index: number;
}) {
  const content = (
    <>
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border sm:h-16 sm:w-16"
        style={{
          borderColor: `${chakra.color}66`,
          color: chakra.accent,
          background: `${chakra.color}22`,
        }}
      >
        <MoodLineIcon moodId={sessionMoodIcons[index]} className="h-7 w-7 sm:h-9 sm:w-9" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-lg leading-tight text-white sm:text-xl">{index + 1}. {session.name.replace(chakra.name.replace(" Chakra", ""), "").trim()}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-300">{session.instructions}</span>
      </span>
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[0.68rem] sm:h-11 sm:w-11 sm:text-sm"
        style={{
          borderColor: completed || unlocked ? `${chakra.color}88` : "rgba(255,255,255,0.22)",
          color: completed || unlocked ? chakra.accent : "rgba(203,213,225,0.7)",
          background: completed ? `${chakra.color}44` : "rgba(255,255,255,0.04)",
        }}
      >
        {completed ? "Done" : unlocked ? "Play" : "Lock"}
      </span>
    </>
  );

  if (!unlocked) {
    return (
      <div className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3 opacity-65 sm:items-center sm:gap-4 sm:p-4">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/session/${chakra.id}/${session.id}/setup`}
      className="flex items-start gap-3 rounded-[1.25rem] border bg-white/[0.04] p-3 transition hover:bg-white/[0.07] sm:items-center sm:gap-4 sm:p-4"
      style={{ borderColor: completed ? `${chakra.color}55` : "rgba(255,255,255,0.1)" }}
    >
      {content}
    </Link>
  );
}

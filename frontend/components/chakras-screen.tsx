"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { chakras } from "@/data/chakras";
import { useAppPreferences } from "@/lib/use-app-preferences";
import { usePlayer } from "@/components/player-provider";
import { ChakraDefinition, ChakraId } from "@/lib/types";

const chakraTags: Record<ChakraId, string[]> = {
  root: ["Grounding", "Stability", "Safety"],
  sacral: ["Flow", "Creativity", "Feeling"],
  "solar-plexus": ["Confidence", "Warmth", "Will"],
  heart: ["Love", "Compassion", "Balance"],
  throat: ["Voice", "Clarity", "Expression"],
  "third-eye": ["Focus", "Insight", "Presence"],
  crown: ["Peace", "Stillness", "Space"],
};

const wheelPositions = [
  { left: "17%", top: "34%" },
  { left: "23%", top: "64%" },
  { left: "42%", top: "79%" },
  { left: "62%", top: "73%" },
  { left: "79%", top: "55%" },
  { left: "78%", top: "30%" },
  { left: "50%", top: "13%" },
];

export function ChakrasScreen() {
  const preferences = useAppPreferences();
  const player = usePlayer();
  const [selectedChakraId, setSelectedChakraId] = useState<ChakraId>("heart");
  const selectedChakra = useMemo(
    () => chakras.find((chakra) => chakra.id === selectedChakraId) ?? chakras[0],
    [selectedChakraId],
  );

  return (
    <div className="relative overflow-hidden pb-4">
      <div className="star-field pointer-events-none absolute inset-0" />

      <header className="relative text-center">
        <p className="text-sm font-medium text-violet-300">Chakra Browser</p>
        <h1 className="mt-2 font-serif text-4xl leading-none text-white sm:text-6xl">Chakra Browser</h1>
        <p className="mt-3 text-lg text-slate-300">Explore • Balance • Align</p>
      </header>

      <section className="relative mx-auto mt-6 aspect-square w-full max-w-[38rem]">
        <div className="absolute inset-[10%] rounded-full border border-violet-300/12" />
        <div className="absolute inset-[18%] rounded-full border border-violet-300/10" />
        <div className="absolute inset-[28%] rounded-full border border-white/8" />
        <div className="absolute left-1/2 top-1/2 h-[48%] w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-violet-200/20 bg-violet-300/8 text-violet-200 shadow-[0_0_48px_rgba(167,139,250,0.22)] sm:h-24 sm:w-24">
          <ChakraGlyph chakraId="crown" className="h-11 w-11 opacity-70 sm:h-16 sm:w-16" />
        </div>

        {chakras.map((chakra, index) => {
          const selected = chakra.id === selectedChakra.id;
          const position = wheelPositions[index];
          return (
              <button
                key={chakra.id}
                type="button"
                onClick={() => setSelectedChakraId(chakra.id)}
                className={`chakra-wheel-node absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-center transition ${
                  selected ? "z-10 h-16 w-16 sm:h-28 sm:w-28" : "h-14 w-14 sm:h-24 sm:w-24"
                }`}
                style={{
                  left: position.left,
                  top: position.top,
                  color: chakra.accent,
                  borderColor: selected ? chakra.accent : `${chakra.color}88`,
                  background: `radial-gradient(circle, ${chakra.color}44, rgba(15,23,42,0.88) 64%)`,
                  boxShadow: selected
                    ? `0 0 42px ${chakra.color}aa, inset 0 0 20px ${chakra.color}33`
                    : `0 0 24px ${chakra.color}55`,
                }}
                aria-label={`Select ${chakra.name}`}
              >
                <ChakraGlyph chakraId={chakra.id} className={selected ? "h-9 w-9 sm:h-14 sm:w-14" : "h-8 w-8 sm:h-11 sm:w-11"} />
                <span
                  className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-[0.65rem] font-semibold text-white sm:-left-3 sm:-top-3 sm:h-7 sm:w-7 sm:text-xs"
                  style={{ backgroundColor: chakra.color }}
                >
                  {index + 1}
                </span>
              </button>
          );
        })}
      </section>

      <ChakraDetailCard
        chakra={selectedChakra}
        duration={preferences.lastSelectedDuration}
        onPlay={() =>
          player.startQuickPlayback({
            chakraId: selectedChakra.id,
            duration: preferences.lastSelectedDuration,
          })
        }
      />
    </div>
  );
}

function ChakraDetailCard({
  chakra,
  duration,
  onPlay,
}: {
  chakra: ChakraDefinition;
  duration: number | "keep-playing";
  onPlay: () => void;
}) {
  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[1.75rem] border bg-slate-950/58 p-5 shadow-[0_28px_80px_rgba(2,6,23,0.42)] backdrop-blur-xl sm:p-6"
      style={{
        borderColor: `${chakra.color}77`,
        boxShadow: `0 0 48px ${chakra.color}22, 0 28px 80px rgba(2,6,23,0.42)`,
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1/2 opacity-35 blur-2xl"
        style={{ background: `radial-gradient(circle at 20% 40%, ${chakra.color}, transparent 62%)` }}
      />
      <div className="relative grid gap-5 sm:grid-cols-[12rem_1fr] sm:items-center">
        <div
          className="mx-auto grid aspect-square w-full max-w-36 place-items-center rounded-full border sm:mx-0 sm:max-w-44"
          style={{
            borderColor: `${chakra.accent}88`,
            color: chakra.accent,
            background: `radial-gradient(circle, ${chakra.color}45, rgba(15,23,42,0.45) 62%, transparent 74%)`,
            boxShadow: `0 0 40px ${chakra.color}66`,
          }}
        >
          <ChakraGlyph chakraId={chakra.id} className="h-24 w-24 sm:h-28 sm:w-28" />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: chakra.accent }}>
            {chakra.frequencyLabel}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-white sm:text-4xl">{chakra.name}</h2>
          <p className="mt-3 text-base leading-7 text-slate-200">{chakra.meaning}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {chakraTags[chakra.id].map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-sm text-slate-100"
                style={{
                  borderColor: `${chakra.accent}44`,
                  backgroundColor: `${chakra.color}22`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Quick play duration: {duration === "keep-playing" ? "Keep playing" : `${duration} minutes`}
          </p>
        </div>
      </div>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onPlay}
          className="inline-flex min-h-14 items-center justify-center rounded-2xl border px-5 py-3 font-serif text-xl text-white transition hover:bg-white/8"
          style={{ borderColor: `${chakra.accent}66` }}
        >
          Play Now
        </button>
        <Link
          href={`/session/${chakra.id}/${chakra.sessions[0].id}/setup`}
          className="inline-flex min-h-14 items-center justify-center rounded-2xl px-5 py-3 font-serif text-xl text-white transition hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${chakra.color}, ${chakra.accent}99)`,
          }}
        >
          Start Journey
        </Link>
      </div>
    </section>
  );
}

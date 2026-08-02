"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ChakraGlyph, MoodLineIcon } from "@/components/chakra-symbol";
import { chakraMap, quickPlayDurations, relaxMoods } from "@/data/chakras";
import { setLastSelectedDuration } from "@/lib/app-preferences";
import { useAppPreferences } from "@/lib/use-app-preferences";
import { usePlayer } from "@/components/player-provider";
import { QuickPlayDuration, RelaxMoodDefinition } from "@/lib/types";

export function HomeScreen() {
  const router = useRouter();
  const preferences = useAppPreferences();
  const player = usePlayer();
  const [selectedMoodId, setSelectedMoodId] = useState<RelaxMoodDefinition["id"] | null>(null);
  const selectedMood = useMemo(
    () => relaxMoods.find((mood) => mood.id === selectedMoodId) ?? null,
    [selectedMoodId],
  );

  return (
    <>
      <div className="relative overflow-hidden pb-4">
        <div className="aurora-field pointer-events-none absolute inset-x-[-1rem] top-[-3rem] h-72" />
        <div className="star-field pointer-events-none absolute inset-0" />

        <section className="relative pt-5 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center text-violet-300">
            <ChakraGlyph chakraId="crown" className="h-16 w-16 drop-shadow-[0_0_22px_rgba(196,154,242,0.55)]" />
          </div>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-6xl">
            Take a breath, Sahil
          </h1>
          <p className="mt-4 text-xl text-violet-200/88 sm:text-2xl">How do you want to feel?</p>
        </section>

        <section className="relative mt-9 grid grid-cols-2 gap-3 sm:gap-4">
          {relaxMoods.map((mood) => (
            <button
              key={mood.id}
              type="button"
              onClick={() => setSelectedMoodId(mood.id)}
              className="mood-card group min-h-24 rounded-[1.25rem] border p-3 text-left transition active:scale-[0.99] sm:min-h-32 sm:rounded-[1.35rem] sm:p-5"
              style={{
                borderColor: `${mood.color}66`,
                background: `linear-gradient(135deg, ${mood.color}24, rgba(15,23,42,0.7) 58%), rgba(255,255,255,0.04)`,
                boxShadow: `0 0 28px ${mood.color}18, inset 0 0 0 1px rgba(255,255,255,0.04)`,
              }}
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-full sm:h-12 sm:w-12"
                style={{
                  color: mood.color,
                  filter: `drop-shadow(0 0 14px ${mood.color}99)`,
                }}
              >
                <MoodLineIcon moodId={mood.id} className="h-7 w-7 sm:h-9 sm:w-9" />
              </div>
              <p className="mt-3 font-serif text-lg leading-tight text-white sm:mt-4 sm:text-2xl">{mood.label}</p>
            </button>
          ))}
        </section>

        <section className="relative mt-6">
          <button
            type="button"
            onClick={() => router.push("/journey")}
            className="w-full rounded-[1.5rem] border border-violet-300/30 bg-violet-400/10 p-4 text-left shadow-[0_0_42px_rgba(124,58,237,0.14)] backdrop-blur-xl transition hover:bg-violet-400/14"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-violet-300/20 bg-violet-400/10 text-violet-200">
                <ChakraGlyph chakraId="crown" className="h-9 w-9" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-2xl text-white">Healing Lessons</span>
                <span className="mt-1 block text-sm text-violet-100/70">Learn through guided chakra journeys</span>
              </span>
              <span className="text-3xl text-violet-100/70" aria-hidden="true">
                &rsaquo;
              </span>
            </div>
          </button>
        </section>
      </div>

      {selectedMood ? (
        <MoodDetailSheet
          mood={selectedMood}
          currentDuration={preferences.lastSelectedDuration}
          onClose={() => setSelectedMoodId(null)}
          onSelectDuration={setLastSelectedDuration}
          onPlay={() => {
            player.startQuickPlayback({
              chakraId: selectedMood.chakraId,
              duration: preferences.lastSelectedDuration,
              moodId: selectedMood.id,
            });
            setSelectedMoodId(null);
          }}
          onLearn={() => {
            router.push(`/journey?chakra=${selectedMood.chakraId}`);
            setSelectedMoodId(null);
          }}
        />
      ) : null}
    </>
  );
}

function MoodDetailSheet({
  mood,
  currentDuration,
  onClose,
  onSelectDuration,
  onPlay,
  onLearn,
}: {
  mood: RelaxMoodDefinition;
  currentDuration: QuickPlayDuration;
  onClose: () => void;
  onSelectDuration: (duration: QuickPlayDuration) => void;
  onPlay: () => void;
  onLearn: () => void;
}) {
  const chakra = chakraMap[mood.chakraId];

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/70 px-2 pb-2 pt-10 backdrop-blur-md sm:items-center sm:justify-center sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className="relative z-10 max-h-[calc(100svh-1rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-violet-200/18 bg-[linear-gradient(180deg,rgba(13,18,38,0.98),rgba(6,10,24,0.98))] p-5 shadow-[0_0_80px_rgba(124,58,237,0.28)] sm:p-7"
        style={{ borderColor: `${chakra.color}55` }}
      >
        <div className="mx-auto mb-6 h-1.5 w-24 rounded-full bg-violet-300/45" />
        <div className="grid gap-5 sm:grid-cols-[12rem_1fr] sm:items-center">
          <div
            className="relative mx-auto grid h-32 w-32 place-items-center rounded-full border sm:h-40 sm:w-40"
            style={{
              borderColor: `${chakra.color}66`,
              background: `radial-gradient(circle, ${chakra.color}36, rgba(15,23,42,0.15) 58%, transparent 72%)`,
              boxShadow: `0 0 46px ${chakra.color}44`,
            }}
          >
            <ChakraGlyph chakraId={chakra.id} className="h-20 w-20 sm:h-24 sm:w-24" />
            <div
              className="absolute inset-8 rounded-full opacity-45 blur-xl"
              style={{
                background: chakra.color,
              }}
            />
          </div>
          <div>
            <p className="text-sm text-violet-200">Mood detail</p>
            <h3 className="mt-2 font-serif text-4xl leading-none text-white sm:text-6xl">{mood.label}</h3>
            <div className="mt-5 space-y-2 text-lg text-violet-200">
              <p>{chakra.name}</p>
              <p>{chakra.frequencyLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-lg leading-8 text-slate-200">{mood.explanation}</p>
        </div>

        <div className="mt-5">
          <p className="text-lg font-semibold text-violet-200">What this music is doing</p>
          <p className="mt-3 text-base leading-8 text-slate-300">{mood.supportText}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {quickPlayDurations.map((duration) => (
            <button
              key={`${duration.value}`}
              type="button"
              onClick={() => onSelectDuration(duration.value)}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm transition ${
                currentDuration === duration.value
                  ? "border-violet-300/70 bg-violet-400/20 text-violet-100 shadow-[0_0_24px_rgba(167,139,250,0.25)]"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {duration.value === "keep-playing" ? "Keep playing" : duration.label.replace("utes", "")}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-[0_0_34px_rgba(124,58,237,0.45)]"
          >
            Play Music
          </button>
          <button
            type="button"
            onClick={onLearn}
            className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-violet-300/25 bg-white/5 px-5 py-3 text-base font-semibold text-violet-200"
          >
            Learn this Chakra
          </button>
        </div>
      </div>
    </div>
  );
}

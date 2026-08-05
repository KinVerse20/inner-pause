"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChakraVisual } from "@/components/chakra-visual";
import { chakraMap, relaxMoodMap } from "@/data/chakras";
import { usePlayer } from "@/components/player-provider";
import { ChakraId, QuickPlayDuration, RelaxMoodId } from "@/lib/types";
import { setLastSelectedDuration } from "@/lib/app-preferences";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${`${secs}`.padStart(2, "0")}`;
};

export function QuickPlayerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activePlayback,
    isPlaying,
    elapsedSeconds,
    audioError,
    startQuickPlayback,
    setCurrentRoute,
    stopPlayback,
    togglePlayback,
    restartPlayback,
  } = usePlayer();
  const [controlsVisible, setControlsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const chakraId = searchParams.get("chakraId") as ChakraId | null;
  const moodId = searchParams.get("mood") as RelaxMoodId | null;
  const durationParam = searchParams.get("duration");
  const duration = (durationParam === "10" || durationParam === "20" || durationParam === "30"
    ? Number(durationParam)
    : durationParam === "keep-playing"
      ? "keep-playing"
      : 20) as QuickPlayDuration;

  const chakra = chakraId ? chakraMap[chakraId] : null;
  const mood = moodId ? relaxMoodMap[moodId] : undefined;

  useEffect(() => {
    if (!chakra) {
      router.replace("/");
      return;
    }

    const route = `/player?chakraId=${chakra.id}${moodId ? `&mood=${moodId}` : ""}&duration=${duration}`;

    if (
      !activePlayback ||
      activePlayback.mode !== "quick" ||
      activePlayback.chakraId !== chakra.id ||
      activePlayback.moodId !== (moodId ?? undefined) ||
      activePlayback.duration !== duration
    ) {
      startQuickPlayback({ chakraId: chakra.id, duration, moodId: moodId ?? undefined });
    } else {
      setCurrentRoute(route);
    }
    setLastSelectedDuration(duration);
  }, [activePlayback, chakra, duration, moodId, router, setCurrentRoute, startQuickPlayback]);

  useEffect(() => {
    if (!isPlaying) return;

    const timeout = window.setTimeout(() => setControlsVisible(false), 2800);
    return () => window.clearTimeout(timeout);
  }, [elapsedSeconds, isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const initialSeconds = activePlayback?.initialSeconds ?? null;
  const secondsRemaining =
    initialSeconds === null ? null : Math.max(initialSeconds - elapsedSeconds, 0);
  const progressPercent =
    initialSeconds && initialSeconds > 0
      ? ((initialSeconds - (secondsRemaining ?? 0)) / initialSeconds) * 100
      : 0;

  useEffect(() => {
    if (!activePlayback || activePlayback.mode !== "quick" || activePlayback.keepPlaying) return;
    if (secondsRemaining !== 0) return;

    stopPlayback();
    router.replace("/");
  }, [activePlayback, router, secondsRemaining, stopPlayback]);

  if (!chakra || !activePlayback) return null;

  return (
    <div
      className="chakra-player-shell relative min-h-dvh overflow-x-hidden bg-[linear-gradient(180deg,#fff8f4,#fbedee_48%,#f2eaf5)] text-[#322d42]"
      onPointerDown={() => setControlsVisible(true)}
      style={
        {
          "--chakra-core": chakra.color,
          "--chakra-accent": chakra.accent,
          "--chakra-glow": chakra.glow,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_5%,rgba(236,169,143,0.35),transparent_18rem),radial-gradient(circle_at_85%_20%,rgba(169,154,200,0.26),transparent_16rem)]" />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.6rem+env(safe-area-inset-top))] sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="relative z-20 grid grid-cols-[2.75rem_1fr_2.75rem] items-start gap-2 sm:grid-cols-[3rem_1fr_3rem] sm:gap-3">
          <button
            type="button"
            onClick={() => {
              stopPlayback();
              router.replace("/");
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/70 text-2xl text-[#a99ac8] backdrop-blur-xl sm:h-12 sm:w-12"
            aria-label="End session"
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>

          <div className="text-center">
            <h1 className="font-serif text-[clamp(1.8rem,8vw,3.75rem)] leading-tight text-[#322d42]">{chakra.name}</h1>
            <p className="mt-1 text-sm sm:mt-2 sm:text-base text-[#6f687d]">
              {mood?.label ?? "The Inner Pause Music"}
            </p>
            <p className="mt-1 text-base text-[#d58e93] sm:mt-2 sm:text-lg">
              {chakra.frequencyLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setControlsVisible(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/70 text-[#a99ac8] backdrop-blur-xl sm:h-12 sm:w-12"
            aria-label="Show controls"
          >
            <span aria-hidden="true">•••</span>
          </button>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
            <ChakraVisual
              chakra={chakra}
              breathLabel={mood?.label ?? "Relax"}
              reducedMotion={reducedMotion}
              elapsedSeconds={elapsedSeconds}
              motionPaused={!isPlaying}
            />
          </div>

          <div
            className={`quick-player-controls w-full max-w-3xl rounded-[1.5rem] border border-white/70 bg-white/72 p-3 shadow-[0_22px_60px_rgba(152,117,139,0.18)] backdrop-blur-2xl transition duration-500 sm:rounded-[1.75rem] sm:p-5 ${
              controlsVisible || !isPlaying ? "opacity-100" : "opacity-72"
            }`}
            style={{ borderColor: `${chakra.accent}33` }}
          >
            <div className="quick-player-track mb-3 flex items-center gap-3 sm:mb-5 sm:gap-4">
              <div
                className="quick-player-track-art grid h-12 w-12 shrink-0 place-items-center rounded-full sm:h-14 sm:w-14"
                style={{
                  background: `radial-gradient(circle, ${chakra.color}66, rgba(15,23,42,0.3))`,
                  boxShadow: `0 0 24px ${chakra.color}66`,
                }}
              >
                <span className="h-7 w-7 rounded-full sm:h-8 sm:w-8" style={{ backgroundColor: chakra.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-[#322d42] sm:text-lg">
                  {mood ? `${mood.label} Inner Pause session` : `${chakra.name} Inner Pause session`}
                </p>
                <p className="mt-1 text-sm text-[#6f687d]">
                  {activePlayback.keepPlaying ? "Playing continuously" : `Session length: ${activePlayback.duration} minutes`}
                </p>
              </div>
            </div>

            {audioError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
                Add the MP3 file to the public/audio folder.
              </div>
            ) : !activePlayback.keepPlaying ? (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#eca98f] to-[#d79bb8]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-[#6f687d]">
                  <p>{formatTime(elapsedSeconds)}</p>
                  <p>{formatTime(secondsRemaining ?? 0)}</p>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-[#6f687d]">Playing continuously</div>
            )}

            <div className="mt-3 grid grid-cols-3 items-center gap-2 sm:mt-5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  restartPlayback();
                  setControlsVisible(true);
                }}
                disabled={audioError}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f1d6d0] bg-white/70 px-3 py-2 text-xs text-[#a77d97] disabled:opacity-50 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={audioError}
                className="mx-auto grid h-16 w-16 place-items-center rounded-full border bg-[#eca98f] text-lg font-semibold text-white disabled:opacity-50 sm:h-20 sm:w-20 sm:text-2xl"
                style={{ borderColor: chakra.accent, boxShadow: `0 0 34px ${chakra.glow}` }}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activePlayback.keepPlaying) return;
                  const nextDuration = activePlayback.duration === 10 ? 20 : activePlayback.duration === 20 ? 30 : "keep-playing";
                  startQuickPlayback({ chakraId: chakra.id, duration: nextDuration, moodId: moodId ?? undefined });
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#f1d6d0] bg-white/70 px-3 py-2 text-xs text-[#a77d97] sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
              >
                Loop
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                router.replace("/");
              }}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#f1d6d0] bg-white/70 px-4 py-2 text-sm text-[#a77d97] sm:mt-4"
            >
              End Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

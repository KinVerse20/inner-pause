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
      className="chakra-player-shell relative min-h-dvh overflow-x-hidden bg-[linear-gradient(180deg,#07142f,#0d1a3a_48%,#07142f)] text-[var(--cream)]"
      onPointerDown={() => setControlsVisible(true)}
      style={
        {
          "--chakra-core": chakra.color,
          "--chakra-accent": chakra.accent,
          "--chakra-glow": chakra.glow,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_4%,rgba(240,206,160,0.26),transparent_20rem),radial-gradient(circle_at_80%_16%,rgba(233,181,190,0.18),transparent_18rem),radial-gradient(circle_at_15%_70%,rgba(119,121,175,0.26),transparent_22rem)]" />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.6rem+env(safe-area-inset-top))] sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="relative z-20 grid grid-cols-[2.75rem_1fr_2.75rem] items-start gap-2 sm:grid-cols-[3rem_1fr_3rem] sm:gap-3">
          <button
            type="button"
            onClick={() => {
              stopPlayback();
              router.replace("/");
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-2xl text-[var(--gold-light)] backdrop-blur-xl sm:h-12 sm:w-12"
            aria-label="End session"
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>

          <div className="text-center">
            <h1 className="font-serif text-[clamp(1.8rem,8vw,3.75rem)] leading-tight text-[var(--cream)]">You are safe here.</h1>
            <p className="mt-1 text-sm sm:mt-2 sm:text-base text-[var(--ip-body)]">
              {mood?.label ?? "The Inner Pause Music"}
            </p>
            <p className="mt-1 text-base text-[var(--gold-primary)] sm:mt-2 sm:text-lg">
              {chakra.name} · {chakra.frequencyLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setControlsVisible(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-[var(--gold-light)] backdrop-blur-xl sm:h-12 sm:w-12"
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
            className={`quick-player-controls w-full max-w-3xl rounded-[1.5rem] border border-[var(--gold-border-soft)] bg-[#111e41]/72 p-3 shadow-[0_22px_60px_rgba(0,0,0,0.26)] backdrop-blur-2xl transition duration-500 sm:rounded-[1.75rem] sm:p-5 ${
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
                <p className="truncate text-base font-medium text-[var(--cream)] sm:text-lg">
                  {mood ? `${mood.label} Inner Pause session` : `${chakra.name} Inner Pause session`}
                </p>
                <p className="mt-1 text-sm text-[var(--ip-body)]">
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
                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#f6dfc1] to-[#e9b5be]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-[var(--ip-body)]">
                  <p>{formatTime(elapsedSeconds)}</p>
                  <p>{formatTime(secondsRemaining ?? 0)}</p>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-[var(--ip-body)]">Playing continuously</div>
            )}

            <div className="mt-3 grid grid-cols-3 items-center gap-2 sm:mt-5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  restartPlayback();
                  setControlsVisible(true);
                }}
                disabled={audioError}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--gold-border-soft)] bg-white/8 px-3 py-2 text-xs text-[var(--ip-body)] disabled:opacity-50 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={audioError}
                className="mx-auto grid h-16 w-16 place-items-center rounded-full border bg-[linear-gradient(135deg,#f6dfc1,#ddb27b)] text-lg font-semibold text-[#07142f] disabled:opacity-50 sm:h-20 sm:w-20 sm:text-2xl"
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
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--gold-border-soft)] bg-white/8 px-3 py-2 text-xs text-[var(--ip-body)] sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
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
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--gold-border-soft)] bg-white/8 px-4 py-2 text-sm text-[var(--ip-body)] sm:mt-4"
            >
              End Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

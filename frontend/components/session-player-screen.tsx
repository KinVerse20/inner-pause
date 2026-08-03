"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

import { ChakraVisual } from "@/components/chakra-visual";
import { usePlayer } from "@/components/player-provider";
import { chakraMap } from "@/data/chakras";
import { isSessionUnlocked } from "@/lib/progress";
import { ChakraId, MoodValue } from "@/lib/types";
import { useHydrated, useProgressStore } from "@/lib/use-progress-store";

const BREATH_STEPS = ["Breathe in", "Hold", "Breathe out"] as const;
const AFFIRMATION_INTERVAL_SECONDS = 45;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${`${secs}`.padStart(2, "0")}`;
};

export function SessionPlayerScreen({
  chakraId,
  sessionId,
}: {
  chakraId: ChakraId;
  sessionId: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    activePlayback,
    isPlaying,
    elapsedSeconds,
    audioError,
    startJourneyPlayback,
    setCurrentRoute,
    stopPlayback,
    togglePlayback,
    restartPlayback,
  } = usePlayer();
  const chakra = chakraMap[chakraId];
  const session = chakra?.sessions.find((item) => item.id === sessionId);
  const progress = useProgressStore();
  const ready = useHydrated();
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [breathIndex, setBreathIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const moodBefore = (searchParams.get("before") as MoodValue | null) ?? "neutral";
  const durationSeconds = session ? session.durationMinutes * 60 : 0;

  const allowed = useMemo(() => {
    if (!chakra || !session) return false;
    return isSessionUnlocked(progress, chakra, session.index);
  }, [chakra, progress, session]);

  useEffect(() => {
    if (ready && (!chakra || !session || !allowed)) {
      router.replace("/journey");
    }
  }, [allowed, chakra, ready, router, session]);

  useEffect(() => {
    if (!session) return;
    const affirmationTimer = window.setInterval(() => {
      setAffirmationIndex((current) => (current + 1) % session.prompts.length);
    }, AFFIRMATION_INTERVAL_SECONDS * 1000);

    return () => window.clearInterval(affirmationTimer);
  }, [session]);

  useEffect(() => {
    if (!session?.breathingPattern) return;
    const breathTimer = window.setInterval(() => {
      setBreathIndex((current) => (current + 1) % BREATH_STEPS.length);
    }, 4000);

    return () => window.clearInterval(breathTimer);
  }, [session?.breathingPattern]);

  useEffect(() => {
    if (!ready || !chakra || !session || !allowed) return;

    const route = `/session/${chakra.id}/${session.id}/player?before=${moodBefore}`;
    if (
      !activePlayback ||
      activePlayback.mode !== "journey" ||
      activePlayback.chakraId !== chakra.id ||
      activePlayback.sessionId !== session.id
    ) {
      startJourneyPlayback({
        chakraId: chakra.id,
        sessionId: session.id,
        title: session.name,
        subtitle: chakra.purpose,
        durationMinutes: session.durationMinutes,
        route,
      });
    } else {
      setCurrentRoute(route);
    }
  }, [activePlayback, allowed, chakra, moodBefore, ready, session, setCurrentRoute, startJourneyPlayback]);

  useEffect(() => {
    if (!isPlaying) return;

    const timeout = window.setTimeout(() => {
      setControlsVisible(false);
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [affirmationIndex, breathIndex, isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  const initialSeconds = activePlayback?.initialSeconds ?? (session ? session.durationMinutes * 60 : 0);
  const secondsRemaining = Math.max(initialSeconds - elapsedSeconds, 0);

  useEffect(() => {
    if (!activePlayback || activePlayback.mode !== "journey") return;
    if (secondsRemaining !== 0) return;

    stopPlayback({ recordQuick: false });
    router.replace(`/session/${chakraId}/${sessionId}/complete?before=${moodBefore}`);
  }, [activePlayback, chakraId, moodBefore, router, secondsRemaining, sessionId, stopPlayback]);

  if (!chakra || !session || !ready || !allowed) return null;

  const progressPercent =
    durationSeconds === 0 ? 0 : ((durationSeconds - secondsRemaining) / durationSeconds) * 100;
  const breathLabel = session.breathingPattern ? BREATH_STEPS[breathIndex] : "Be here";
  const controlsEmphasized = controlsVisible || !isPlaying || audioError;

  return (
    <div
      className={`chakra-player-shell relative min-h-dvh overflow-x-hidden bg-gradient-to-b ${chakra.gradient} text-slate-50`}
      onPointerDown={() => setControlsVisible(true)}
      style={
        {
          "--chakra-core": chakra.color,
          "--chakra-accent": chakra.accent,
          "--chakra-glow": chakra.glow,
        } as CSSProperties
      }
    >
      <div className="psychedelic-backdrop pointer-events-none absolute inset-0" />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="relative z-20 grid grid-cols-[2.75rem_1fr_2.75rem] items-start gap-2 sm:grid-cols-[3rem_1fr_3rem] sm:gap-3">
          <button
            type="button"
            onClick={() => {
              stopPlayback({ recordQuick: false });
              router.push(`/session/${chakra.id}/${session.id}/complete?before=${moodBefore}`);
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/8 text-2xl text-white/85 backdrop-blur-xl sm:h-12 sm:w-12"
            aria-label="End session"
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>

          <div className="text-center">
            <h1 className="font-serif text-3xl leading-tight text-white sm:text-6xl">{chakra.name}</h1>
            <p className="mt-1 text-sm sm:mt-2 sm:text-base" style={{ color: chakra.accent }}>
              {session.name}
            </p>
            <p className="mt-1 text-base sm:mt-2 sm:text-lg" style={{ color: chakra.accent }}>
              {chakra.frequencyLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setControlsVisible(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/8 text-white/85 backdrop-blur-xl sm:h-12 sm:w-12"
            aria-label="Show controls"
          >
            <span aria-hidden="true">•••</span>
          </button>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <ChakraVisual
              chakra={chakra}
              breathLabel={breathLabel}
              reducedMotion={reducedMotion}
              elapsedSeconds={elapsedSeconds}
              motionPaused={!isPlaying}
            />
          </div>

          <div className="mx-auto -mt-3 w-full max-w-2xl text-center sm:-mt-10">
            <p className="text-base font-medium leading-relaxed text-white/92 sm:text-2xl">
              {session.prompts[affirmationIndex]}
            </p>
            {session.breathingPattern ? (
              <p className="mx-auto mt-3 inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/72 backdrop-blur-xl sm:mt-4 sm:px-5">
                {BREATH_STEPS[breathIndex]}
              </p>
            ) : null}
          </div>

          <div
            className={`player-control-glass mt-4 w-full max-w-3xl rounded-[1.5rem] border p-4 backdrop-blur-2xl transition duration-500 sm:mt-6 sm:rounded-[1.75rem] sm:p-5 ${
              controlsEmphasized ? "opacity-100" : "opacity-72"
            }`}
            style={{ borderColor: `${chakra.accent}33` }}
          >
            <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full sm:h-14 sm:w-14"
                style={{
                  background: `radial-gradient(circle, ${chakra.color}66, rgba(15,23,42,0.3))`,
                  boxShadow: `0 0 24px ${chakra.color}66`,
                }}
              >
                <span className="h-7 w-7 rounded-full sm:h-8 sm:w-8" style={{ backgroundColor: chakra.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-white sm:text-lg">{session.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300 sm:text-sm">{session.instructions}</p>
              </div>
            </div>

            {audioError ? (
              <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4 text-center text-sm text-amber-50">
                Add the MP3 file to the public/audio folder.
              </div>
            ) : (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-white/12">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-200 to-orange-100"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-white/78">
                  <p>{formatTime(elapsedSeconds)}</p>
                  <p>{formatTime(secondsRemaining)}</p>
                </div>
              </>
            )}

            <div className="mt-4 grid grid-cols-3 items-center gap-2 sm:mt-5 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setAffirmationIndex(0);
                  setBreathIndex(0);
                  restartPlayback();
                  setControlsVisible(true);
                }}
                disabled={audioError}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs text-white/90 disabled:opacity-50 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={audioError}
                className="mx-auto grid h-16 w-16 place-items-center rounded-full border bg-white/10 text-lg font-semibold text-white disabled:opacity-50 sm:h-20 sm:w-20 sm:text-2xl"
                style={{ borderColor: chakra.accent, boxShadow: `0 0 34px ${chakra.glow}` }}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopPlayback({ recordQuick: false });
                  router.push(`/session/${chakra.id}/${session.id}/complete?before=${moodBefore}`);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs text-white/90 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
              >
                End
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

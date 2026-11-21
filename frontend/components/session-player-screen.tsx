"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

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
      className="mvp-bg chakra-player-shell relative min-h-dvh overflow-x-hidden text-[var(--ip-ink)]"
      onPointerDown={() => setControlsVisible(true)}
      style={
        {
          "--chakra-core": chakra.color,
          "--chakra-accent": chakra.accent,
          "--chakra-glow": chakra.glow,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,138,42,0.11),transparent_24rem)]" />
      <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="relative z-20 grid grid-cols-[2.75rem_1fr_2.75rem] items-start gap-2 sm:grid-cols-[3rem_1fr_3rem] sm:gap-3">
          <button
            type="button"
            onClick={() => {
              stopPlayback({ recordQuick: false });
              router.push(`/session/${chakra.id}/${session.id}/complete?before=${moodBefore}`);
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-2xl text-[var(--gold-light)] backdrop-blur-xl sm:h-12 sm:w-12"
            aria-label="End session"
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>

          <div className="text-center">
            <p className="minimal-label text-[0.68rem]">Healing</p>
            <h1 className="mt-2 text-3xl leading-tight text-[var(--ip-ink)] sm:text-6xl">{chakra.name}</h1>
            <p className="mt-1 text-sm text-[var(--gold-light)] sm:mt-2 sm:text-base">
              {session.name}
            </p>
            <p className="mt-1 text-base text-[var(--gold-light)] sm:mt-2 sm:text-lg">
              {chakra.frequencyLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setControlsVisible(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-[var(--gold-light)] backdrop-blur-xl sm:h-12 sm:w-12"
            aria-label="Show controls"
          >
            <span aria-hidden="true">•••</span>
          </button>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div className={`relative grid place-items-center ${!isPlaying || reducedMotion ? "chakra-scene--paused" : ""}`}>
              <div className="relative grid aspect-square w-[min(76vw,24rem)] place-items-center">
                <div className="absolute inset-0 rounded-full border border-white/10" />
                <div className="absolute inset-[10%] rounded-full border border-[rgba(255,138,42,0.22)]" />
                <div className="healing-orbit-sphere w-[62%]" />
                <p className="absolute bottom-4 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-[var(--ip-body)] backdrop-blur-xl">{breathLabel}</p>
              </div>
            </div>
          </div>

          <div className="mx-auto -mt-3 w-full max-w-2xl text-center sm:-mt-10">
            <p className="text-base font-medium leading-relaxed text-[var(--ip-ink)] sm:text-2xl">
              {session.prompts[affirmationIndex]}
            </p>
            {session.breathingPattern ? (
              <p className="mx-auto mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-[var(--ip-body)] backdrop-blur-xl sm:mt-4 sm:px-5">
                {BREATH_STEPS[breathIndex]}
              </p>
            ) : null}
          </div>

          <div
            className={`obsidian-panel mt-4 w-full max-w-3xl rounded-[1.5rem] p-4 transition duration-500 sm:mt-6 sm:rounded-[1.75rem] sm:p-5 ${
              controlsEmphasized ? "opacity-100" : "opacity-72"
            }`}
          >
            <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full sm:h-14 sm:w-14"
                style={{
                  background: "radial-gradient(circle, rgba(255,138,42,0.22), rgba(35,38,41,0.9))",
                  boxShadow: "0 0 24px rgba(255,138,42,0.18)",
                }}
              >
                <span className="h-7 w-7 rounded-full bg-[var(--gold-primary)] sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-[var(--ip-ink)] sm:text-lg">{session.name}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--ip-muted)] sm:text-sm">{session.instructions}</p>
              </div>
            </div>

            {audioError ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-center text-sm text-amber-200">
                Add the MP3 file to the public/audio folder.
              </div>
            ) : (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[var(--gold-primary)] shadow-[0_0_14px_rgba(255,138,42,0.8)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-[var(--ip-body)]">
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
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--ip-body)] disabled:opacity-50 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={audioError}
                className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[rgba(255,138,42,0.55)] bg-[rgba(244,122,34,0.12)] text-lg font-semibold text-[var(--gold-light)] shadow-[0_0_34px_rgba(255,138,42,0.18)] disabled:opacity-50 sm:h-20 sm:w-20 sm:text-2xl"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopPlayback({ recordQuick: false });
                  router.push(`/session/${chakra.id}/${session.id}/complete?before=${moodBefore}`);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--ip-body)] sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
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

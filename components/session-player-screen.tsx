"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MvpShell } from "@/components/mvp-shell";
import { usePlayer } from "@/components/player-provider";
import { WaveformFace } from "@/components/waveform-face";
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

  const moodBefore = (searchParams.get("before") as MoodValue | null) ?? "neutral";
  const durationSeconds = session ? session.durationMinutes * 60 : 0;

  const allowed = useMemo(() => {
    if (!chakra || !session) return false;
    return isSessionUnlocked(progress, chakra, session.index);
  }, [chakra, progress, session]);

  useEffect(() => {
    if (ready && (!chakra || !session || !allowed)) {
      router.replace("/practice");
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

  return (
    <MvpShell hideNav>
      <div
        className="relative min-h-dvh overflow-x-hidden px-0 pb-[calc(1rem+env(safe-area-inset-bottom))] text-[var(--ip-ink)]"
        style={{ background: `radial-gradient(circle at 50% 30%, ${chakra.accent}33, transparent 45%), var(--ip-bg)` }}
      >
        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-3.5 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                stopPlayback({ recordQuick: false });
                router.push(`/session/${chakra.id}/${session.id}/complete?before=${moodBefore}`);
              }}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ip-border)] bg-white/70"
              aria-label="End session"
            >
              ‹
            </button>
            <div className="text-center">
              <h1 className="font-serif text-2xl text-[var(--ip-ink)]">{session.name}</h1>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: chakra.color }}>
                {chakra.frequencyLabel} · {chakra.name.replace(" Chakra", "")}
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ip-border)] bg-white/70 text-[var(--ip-muted)]" aria-hidden="true">
              ⌇
            </span>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center py-4">
            <WaveformFace
              progress={durationSeconds ? (durationSeconds - secondsRemaining) / durationSeconds : 0}
              color={chakra.color}
              accent={chakra.accent}
              className="w-[min(64vw,18rem)]"
            />

            <div className="mx-auto mt-4 max-w-xl text-center">
              <p className="text-base font-medium leading-relaxed text-[var(--ip-ink)] sm:text-lg">
                {session.prompts[affirmationIndex]}
              </p>
              {session.breathingPattern ? (
                <p className="mx-auto mt-3 inline-flex rounded-full border border-[var(--ip-border)] bg-white/80 px-4 py-1.5 text-xs text-[var(--ip-body)]">
                  {breathLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="w-full max-w-2xl self-center rounded-[1.5rem] border border-[var(--ip-border)] bg-[var(--ip-card)] p-4 shadow-[var(--ip-shadow-md)] backdrop-blur-xl">
            <p className="truncate text-sm font-medium text-[var(--ip-ink)]">{session.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--ip-muted)]">{session.instructions}</p>

            {audioError ? (
              <p className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50 p-3 text-center text-sm text-amber-900">
                Add the MP3 file to the public/audio folder.
              </p>
            ) : (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ip-lavender)]">
                  <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: chakra.color }} />
                </div>
                <div className="mt-2 flex justify-between text-sm text-[var(--ip-muted)]">
                  <span>{formatTime(elapsedSeconds)}</span>
                  <span>{formatTime(secondsRemaining)}</span>
                </div>
              </>
            )}

            <div className="mt-3 grid grid-cols-3 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAffirmationIndex(0);
                  setBreathIndex(0);
                  restartPlayback();
                }}
                disabled={audioError}
                className="min-h-11 rounded-full border border-[var(--ip-border)] bg-white/70 text-xs text-[var(--ip-ink)] disabled:opacity-50"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={audioError}
                className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[var(--ip-gold-border)] bg-[linear-gradient(135deg,var(--ip-gold-2),var(--ip-gold))] text-sm font-semibold text-[#241b10] shadow-[var(--ip-shadow-md)] disabled:opacity-50"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopPlayback({ recordQuick: false });
                  router.push(`/session/${chakra.id}/${session.id}/complete?before=${moodBefore}`);
                }}
                className="min-h-11 rounded-full border border-[var(--ip-border)] bg-white/70 text-xs text-[var(--ip-ink)]"
              >
                End
              </button>
            </div>
          </div>
        </div>
      </div>
    </MvpShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { RitualBackdrop, RitualOrb, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { chakraMap, relaxMoodMap } from "@/data/chakras";
import { usePlayer } from "@/components/player-provider";
import { ChakraId, QuickPlayDuration, RelaxMoodId } from "@/lib/types";
import { setLastSelectedDuration } from "@/lib/app-preferences";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${`${secs}`.padStart(2, "0")}`;
};

function shortTitle(label?: string) {
  if (!label) return "Ground";
  if (label.toLowerCase().includes("sleep")) return "Sleep";
  if (label.toLowerCase().includes("focus")) return "Focus";
  if (label.toLowerCase().includes("release")) return "Release";
  if (label.toLowerCase().includes("calm")) return "Calm";
  return label.split(" ")[0] ?? "Ground";
}

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

  const title = shortTitle(mood?.label ?? activePlayback.title);
  const tone = inferWeatherTone(`${mood?.label ?? ""} ${chakra.meaning} ${chakra.id}`);

  return (
    <RitualBackdrop tone={tone} className="quick-player-page min-h-dvh rounded-none border-0 text-[var(--ip-ink)]">
      <main className="quick-player-layout relative z-10 mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] lg:max-w-[72rem] lg:px-8">
        <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <button
            type="button"
            onClick={() => {
              stopPlayback();
              router.replace("/");
            }}
            className="grid h-11 w-11 place-items-center rounded-full text-3xl text-[var(--ip-body)]"
            aria-label="End session"
          >
            ‹
          </button>
          <p className="minimal-label text-center text-xs">Healing</p>
          <button type="button" onClick={restartPlayback} disabled={audioError} className="grid h-11 w-11 place-items-center rounded-full text-xl text-[var(--ip-body)] disabled:opacity-40" aria-label="Restart">
            •••
          </button>
        </header>

        <section className={`quick-player-visual grid flex-1 place-items-center py-4 ${!isPlaying || reducedMotion ? "is-paused" : ""}`}>
          <RitualOrb
            stage="restore"
            tone={tone}
            active={isPlaying && !reducedMotion}
            intensity={activePlayback.keepPlaying ? 0.82 : Math.max(0.45, progressPercent / 100)}
            label="Quick relief ritual orb"
            className="quick-player-orbit w-[min(82vw,25rem)] lg:w-[min(42vw,28rem)]"
          />
        </section>

        <section className="quick-player-title mx-auto w-full max-w-[28rem] text-center">
          <h1 className="minimal-label text-2xl tracking-[0.52em] text-[var(--ip-ink)]">{title}</h1>
          <div className="quick-player-divider mx-auto mt-4 h-px w-8 bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(255,122,34,0.8)]" />
          <p className="quick-player-meta mt-4 text-sm text-[var(--ip-muted)]">{chakra.name.replace(" Chakra", "")} · {chakra.frequencyLabel}</p>
        </section>

        <section className="quick-player-controls mt-7">
          {audioError ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-center text-sm text-amber-200">
              Add the MP3 file to the public/audio folder.
            </div>
          ) : !activePlayback.keepPlaying ? (
            <>
              <div className="h-1 overflow-hidden rounded-full bg-white/12">
                <div className="h-full rounded-full bg-[var(--gold-primary)] shadow-[0_0_14px_rgba(255,122,34,0.8)]" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-lg text-[var(--ip-body)]">
                <p>{formatTime(elapsedSeconds)}</p>
                <p>{formatTime(secondsRemaining ?? 0)}</p>
              </div>
            </>
          ) : (
            <div className="text-center text-lg text-[var(--ip-body)]">Playing continuously</div>
          )}

          <div className="quick-player-buttons mt-5 grid grid-cols-5 items-center gap-2 text-[var(--ip-body)]">
            <button type="button" className="grid min-h-11 place-items-center rounded-full text-2xl" aria-label="Shuffle">⌘</button>
            <button type="button" onClick={restartPlayback} disabled={audioError} className="grid min-h-11 place-items-center rounded-full text-3xl disabled:opacity-40" aria-label="Previous">‹</button>
            <button
              type="button"
              onClick={togglePlayback}
              disabled={audioError}
              className="quick-player-main-button mx-auto grid h-20 w-20 place-items-center rounded-full border border-[rgba(255,138,50,0.5)] bg-[rgba(244,122,34,0.08)] text-3xl text-[var(--gold-light)] shadow-[0_0_36px_rgba(255,122,34,0.18)] disabled:opacity-50"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "Ⅱ" : "▶"}
            </button>
            <button type="button" onClick={restartPlayback} disabled={audioError} className="grid min-h-11 place-items-center rounded-full text-3xl disabled:opacity-40" aria-label="Next">›</button>
            <button
              type="button"
              onClick={() => {
                if (activePlayback.keepPlaying) return;
                startQuickPlayback({ chakraId: chakra.id, duration: "keep-playing", moodId: moodId ?? undefined });
              }}
              className="grid min-h-11 place-items-center rounded-full text-2xl"
              aria-label="Repeat continuously"
            >
              ↻
            </button>
          </div>

          <div className="obsidian-panel quick-player-footer mt-6 grid grid-cols-[3rem_1fr_3rem] items-center rounded-full px-4 py-3">
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-2xl text-[var(--ip-body)]" aria-label="Favourite">♡</button>
            <div className={`mini-waveform ${!isPlaying ? "is-paused" : ""}`} aria-hidden="true" />
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                router.replace("/");
              }}
              className="grid h-11 w-11 place-items-center rounded-full text-xl text-[var(--ip-body)]"
              aria-label="End session"
            >
              ≡
            </button>
          </div>
        </section>
      </main>
    </RitualBackdrop>
  );
}

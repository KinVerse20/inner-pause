"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { chakraMap, relaxMoodMap } from "@/data/chakras";
import { recordQuickSession } from "@/lib/app-preferences";
import { ChakraId, QuickPlayDuration, RelaxMoodId } from "@/lib/types";

type PlaybackMode = "quick" | "journey";

interface ActivePlayback {
  mode: PlaybackMode;
  chakraId: ChakraId;
  chakraName: string;
  frequencyLabel: string;
  audioPath: string;
  title: string;
  subtitle?: string;
  moodId?: RelaxMoodId;
  moodLabel?: string;
  sessionId?: string;
  duration: QuickPlayDuration | number;
  keepPlaying: boolean;
  route: string;
  startedAt: number;
  timerStartedAt: number;
  initialSeconds: number | null;
}

interface PlayerContextValue {
  activePlayback: ActivePlayback | null;
  isPlaying: boolean;
  elapsedSeconds: number;
  audioError: boolean;
  startQuickPlayback: (input: {
    chakraId: ChakraId;
    duration: QuickPlayDuration;
    moodId?: RelaxMoodId;
  }) => void;
  startJourneyPlayback: (input: {
    chakraId: ChakraId;
    sessionId: string;
    title: string;
    subtitle?: string;
    durationMinutes: number;
    route: string;
  }) => void;
  togglePlayback: () => void;
  restartPlayback: () => void;
  stopPlayback: (options?: { recordQuick?: boolean }) => void;
  setCurrentRoute: (route: string) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const getDurationSeconds = (duration: QuickPlayDuration | number) =>
  duration === "keep-playing" ? null : Number(duration) * 60;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activePlayback, setActivePlayback] = useState<ActivePlayback | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (!activePlayback || !isPlaying) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - activePlayback.timerStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activePlayback, isPlaying]);

  useEffect(() => {
    if (!audioRef.current || !activePlayback) return;

    audioRef.current.src = activePlayback.audioPath;
    audioRef.current.loop = true;
    audioRef.current.currentTime = 0;
    setAudioError(false);
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        setAudioError(true);
      });
  }, [activePlayback]);

  const startQuickPlayback = useCallback(
    ({ chakraId, duration, moodId }: { chakraId: ChakraId; duration: QuickPlayDuration; moodId?: RelaxMoodId }) => {
      const chakra = chakraMap[chakraId];
      const mood = moodId ? relaxMoodMap[moodId] : undefined;
      const seconds = getDurationSeconds(duration);
      const nextRoute = `/player?chakraId=${chakraId}${moodId ? `&mood=${moodId}` : ""}&duration=${duration}`;

      setElapsedSeconds(0);
      setAudioError(false);
      setActivePlayback((current) => {
        if (
          current?.mode === "quick" &&
          current.chakraId === chakraId &&
          current.moodId === moodId &&
          current.duration === duration &&
          current.route === nextRoute
        ) {
          return current;
        }

        return {
          mode: "quick",
          chakraId,
          chakraName: chakra.name,
          frequencyLabel: chakra.frequencyLabel,
          audioPath: chakra.audioPath,
          title: mood ? mood.label : `${chakra.name} music`,
          subtitle: chakra.meaning,
          moodId,
          moodLabel: mood?.label,
          duration,
          keepPlaying: duration === "keep-playing",
          route: nextRoute,
          startedAt: Date.now(),
          timerStartedAt: Date.now(),
          initialSeconds: seconds,
        };
      });
      if (pathname !== "/player") router.push(nextRoute);
    },
    [pathname, router],
  );

  const startJourneyPlayback = useCallback(
    ({
      chakraId,
      sessionId,
      title,
      subtitle,
      durationMinutes,
      route,
    }: {
      chakraId: ChakraId;
      sessionId: string;
      title: string;
      subtitle?: string;
      durationMinutes: number;
      route: string;
    }) => {
      const chakra = chakraMap[chakraId];
      setElapsedSeconds(0);
      setAudioError(false);
      setActivePlayback((current) => {
        if (
          current?.mode === "journey" &&
          current.chakraId === chakraId &&
          current.sessionId === sessionId &&
          current.route === route
        ) {
          return current;
        }

        return {
          mode: "journey",
          chakraId,
          chakraName: chakra.name,
          frequencyLabel: chakra.frequencyLabel,
          audioPath: chakra.audioPath,
          title,
          subtitle,
          sessionId,
          duration: durationMinutes,
          keepPlaying: false,
          route,
          startedAt: Date.now(),
          timerStartedAt: Date.now(),
          initialSeconds: durationMinutes * 60,
        };
      });
      if (`${pathname}${typeof window !== "undefined" ? window.location.search : ""}` !== route) {
        router.push(route);
      }
    },
    [pathname, router],
  );

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !activePlayback) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current
      .play()
      .then(() => {
        setActivePlayback((current) =>
          current
            ? {
                ...current,
                timerStartedAt: Date.now() - elapsedSeconds * 1000,
              }
            : current,
        );
        setIsPlaying(true);
      })
      .catch(() => setIsPlaying(false));
  }, [activePlayback, elapsedSeconds, isPlaying]);

  const restartPlayback = useCallback(() => {
    if (!audioRef.current || !activePlayback) return;
    audioRef.current.currentTime = 0;
    setElapsedSeconds(0);
    setActivePlayback({ ...activePlayback, timerStartedAt: Date.now(), startedAt: Date.now() });
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        setAudioError(true);
      });
  }, [activePlayback]);

  const stopPlayback = useCallback(
    (options?: { recordQuick?: boolean }) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (activePlayback?.mode === "quick" && options?.recordQuick !== false) {
        const listenedMinutes = Math.max(1, Math.floor((Date.now() - activePlayback.startedAt) / 60_000));
        recordQuickSession({
          chakraId: activePlayback.chakraId,
          duration: activePlayback.duration as QuickPlayDuration,
          listenedMinutes,
          moodId: activePlayback.moodId,
        });
      }

      setActivePlayback(null);
      setElapsedSeconds(0);
      setIsPlaying(false);
      setAudioError(false);
    },
    [activePlayback],
  );

  const setCurrentRoute = useCallback((route: string) => {
    setActivePlayback((current) => {
      if (!current || current.route === route) return current;
      return { ...current, route };
    });
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      activePlayback,
      isPlaying,
      elapsedSeconds,
      audioError,
      startQuickPlayback,
      startJourneyPlayback,
      togglePlayback,
      restartPlayback,
      stopPlayback,
      setCurrentRoute,
    }),
    [activePlayback, audioError, elapsedSeconds, isPlaying, restartPlayback, setCurrentRoute, startJourneyPlayback, startQuickPlayback, stopPlayback, togglePlayback],
  );

  const hideMiniPlayer = pathname === "/player" || pathname.includes("/session/") && pathname.endsWith("/player");

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        onError={() => {
          setAudioError(true);
          setIsPlaying(false);
        }}
      />
      {!hideMiniPlayer && activePlayback ? <MiniPlayer /> : null}
    </PlayerContext.Provider>
  );
}

function MiniPlayer() {
  const router = useRouter();
  const player = usePlayer();

  if (!player.activePlayback) return null;

  return (
    <div
      className="fixed inset-x-0 z-30 px-2.5 sm:px-4"
      style={{ bottom: "calc(4.9rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-1.5 rounded-[1.5rem] border border-white/70 bg-white/86 px-3 py-2.5 shadow-[0_18px_54px_rgba(152,117,139,0.18)] backdrop-blur-xl sm:flex sm:gap-3 sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={() => router.push(player.activePlayback?.route ?? "/player")}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-medium text-[#322d42]">{player.activePlayback.chakraName}</p>
          <p className="text-xs text-[#6f687d]">
            {player.activePlayback.moodLabel ?? player.activePlayback.frequencyLabel}
          </p>
        </button>
        <button
          type="button"
          onClick={player.togglePlayback}
          className="min-h-10 rounded-full border border-[#f1d6d0] bg-[#fff8f4] px-2.5 py-2 text-xs text-[#a77d97] sm:px-4 sm:text-sm"
        >
          {player.isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => router.push(player.activePlayback?.route ?? "/player")}
          className="min-h-10 rounded-full border border-[#f1d6d0] bg-[#fff8f4] px-2.5 py-2 text-xs text-[#a77d97] sm:px-4 sm:text-sm"
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => player.stopPlayback()}
          className="min-h-10 rounded-full border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700 sm:px-4 sm:text-sm"
        >
          Stop
        </button>
      </div>
    </div>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};

"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { stopAt, type PauseStop } from "@inner-pause/shared";

import { haptic } from "@/lib/haptics";
import { getPauseRecord, recordListening, type PauseRecord } from "@/lib/pause-storage";
import { settlePracticeDays } from "@/lib/programme-storage";
import { getPreferences, updatePreferences } from "@/lib/preferences-store";
import { isWebmUrl, markAacUnplayable, playableRenderUrl, webmUrl } from "@/lib/render-format";
import { findBuiltInSound, soundUrlFor, undertoneGain, type BuiltInSoundId, type UndertoneLevel } from "@/lib/sound-library";
import type { ToneSetting } from "@/components/sound-sheet";
import { parseFrequencyHz, useToneLayer } from "@/lib/use-tone-layer";
import { useTunedSound } from "@/lib/use-tuned-sound";

// The running Pause, for the whole app. It lives in the root layout, so the
// sound, the tone and the clock carry on while you move between tabs (like
// a music app); the player screen is only a view of it, and a mini player
// above the tab bar shows it everywhere else.

// docs/PRODUCT_FLOW.md §4/§7: the center Pause action's "Get comfortable"
// transition is a fixed, brief moment, and it always auto-advances.
const COMFORTABLE_SECONDS = 5;

// docs/PRODUCT_FLOW.md §10: a brief, quiet closing beat between playback
// ending and the check-in question, never a hard cut.
const CLOSING_BEAT_MS = 2600;

// A Pause's sound swells in gently, and eases back in after being paused.
export const SOUND_FADE_IN_SECONDS = 10;
const SOUND_RESUME_FADE_SECONDS = 1.5;

// …and fades out over its final stretch instead of stopping. Sleep gets a
// long, slow fade so the end of the Pause never wakes anyone.
const SOUND_FADE_OUT_SECONDS = 10;
const SLEEP_FADE_OUT_SECONDS = 45;

// Starting another Pause while one plays: the old one steps aside quickly.
const HANDOVER_FADE_SECONDS = 0.4;

// Time listened is saved this often while playing, and whenever it stops.
const LISTENING_SAVE_SECONDS = 5;

// A Pause with several centres: the undertone crossfades over this long.
const STOP_CROSSFADE_SECONDS = 4;

function soundFadeOutSeconds(record: PauseRecord) {
  const seconds = record.outcomeId === "sleep" ? SLEEP_FADE_OUT_SECONDS : SOUND_FADE_OUT_SECONDS;
  return Math.min(seconds, Math.floor(record.durationSeconds / 4));
}

export type SessionPhase = "transition" | "playing" | "closing" | "checkin";

export interface PauseSession {
  record: PauseRecord | null;
  phase: SessionPhase;
  elapsed: number;
  playing: boolean;
  muted: boolean;
  audioError: boolean;
  /** The check-in was answered or skipped: nothing left to show. */
  finished: boolean;
  frequencyOn: boolean;
  undertone: UndertoneLevel;
  builtIn: boolean;
  builtInSoundId: BuiltInSoundId | null;
  /** A Pause with several centres: its stops, and the one playing. Null for a single Pause. */
  stops: PauseStop[] | null;
  stopIndex: number;
  /** The frequency the Pause is tuned to now (its current stop's), and the one actually sounding (dev tester). */
  pauseHz: number | null;
  targetHz: number | null;
  hasSoundFile: boolean;
  renderedFile: boolean;
  devTuningOff: boolean;
  /** The last page you were on outside the player: where minimising takes you. */
  backTo: string;
  /** Load a Pause record into the session (no-op if it's already the one), its clock at `resumeAt`. */
  load: (id: string, options?: { resumeAt?: number }) => void;
  begin: () => void;
  togglePlayback: () => void;
  restart: () => void;
  toggleMute: () => void;
  chooseSound: (id: BuiltInSoundId) => void;
  chooseTone: (tone: ToneSetting) => void;
  /** End now and go to the check-in. */
  endEarly: () => void;
  /** The check-in is done: the session closes when the player is left. */
  finish: () => void;
  /** The player screen is going away: keep the Pause running, or let it go if it never started. */
  release: () => void;
  setDevToneHz: (hz: number | null) => void;
  toggleDevTuning: () => void;
}

const SessionContext = createContext<PauseSession | null>(null);

export function usePauseSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("usePauseSession needs PauseSessionProvider");
  return value;
}

export function PauseSessionProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [record, setRecord] = useState<PauseRecord | null>(null);
  const [phase, setPhase] = useState<SessionPhase>("transition");
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [finished, setFinished] = useState(false);
  // You -> Preferences -> Ambient sound and Frequency, read when a Pause loads.
  const [frequencyOn, setFrequencyOn] = useState(false);
  const [ambientOn, setAmbientOn] = useState(true);
  // Built-in library sound and undertone strength, switchable live.
  const [builtInSoundId, setBuiltInSoundId] = useState<BuiltInSoundId | null>(null);
  const [undertone, setUndertone] = useState<UndertoneLevel>("balanced");
  // Ignore the audio element's own pause event while we swap sources, so a
  // sound change never stops the Pause clock.
  const switchingRef = useRef(false);
  const closingStartedRef = useRef(false);
  const closingFadeStartedRef = useRef(false);
  const closingTimerRef = useRef<number | undefined>(undefined);

  // Dev-only frequency tester overrides.
  const [devToneHz, setDevToneHz] = useState<number | null>(null);
  const [devTuningOff, setDevTuningOff] = useState(false);

  const pathname = usePathname();
  const [backTo, setBackTo] = useState("/");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pathname && !pathname.startsWith("/pause/player")) setBackTo(pathname);
  }, [pathname]);

  // What a Pause plays: a built-in library sound with the frequency as a
  // soft undertone beneath it, or an admin-uploaded sound tuned to the
  // frequency (the server's rendering once ready, the original tuned live
  // until then). No sound, or Ambient sound off: a soft tone on its own.
  const builtIn = Boolean(record?.builtInSoundId);
  const builtInSound = builtIn ? findBuiltInSound(builtInSoundId ?? record?.builtInSoundId) : undefined;
  // Several centres: the one playing now gives the frequency.
  const stops = record?.blocks && record.blocks.length > 1 ? record.blocks : null;
  const stopIndex = stops ? (stopAt(stops, elapsed)?.index ?? 0) : 0;
  const pauseHz = stops ? stops[stopIndex].hz : record ? parseFrequencyHz(record.frequencyLabel) : null;
  const originalUrl = ambientOn ? (builtIn ? soundUrlFor(builtInSound, pauseHz) : (record?.ambientSoundUrl ?? null)) : null;
  // A tuned recording already carries the frequency: no undertone on top.
  const premixed = Boolean(builtInSound?.tunedFile);
  const targetHz = devToneHz ?? (frequencyOn ? pauseHz : null);
  // Rendered files come as AAC and Opus (lib/render-format.ts). If one
  // can't play, fall back: AAC, then Opus, then the original tuned live.
  const [aacFailed, setAacFailed] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);
  const rendering =
    devToneHz !== null || renderFailed || !ambientOn
      ? null
      : ((frequencyOn && !devTuningOff ? record?.ambientTunedUrl : record?.ambientPlainUrl) ?? null);
  const renderedUrl = rendering ? (aacFailed ? webmUrl(rendering) : playableRenderUrl(rendering)) : null;
  const soundUrl = renderedUrl ?? originalUrl;

  // Both follow playback exactly: audible only while the Pause is actually
  // playing and unmuted (or its sound is already playing ahead of it).
  const audible = !finished && playing && !muted && (phase === "playing" || phase === "transition");
  useToneLayer(
    builtIn ? (premixed && originalUrl ? null : targetHz) : originalUrl ? null : targetHz,
    audible && phase === "playing",
    builtIn && originalUrl ? undertoneGain(undertone) : undefined,
    stops ? STOP_CROSSFADE_SECONDS : 0,
  );

  // Moving to the next centre: a soft haptic (the player says where).
  const lastStopRef = useRef(stopIndex);
  useEffect(() => {
    if (stopIndex === lastStopRef.current) return;
    lastStopRef.current = stopIndex;
    if (stops && phase === "playing" && stopIndex > 0) haptic("moment");
  }, [stopIndex, stops, phase]);
  const tunedSound = useTunedSound(audioRef, {
    enabled: Boolean(originalUrl) && !renderedUrl,
    frequencyHz: renderedUrl || devTuningOff || builtIn ? null : targetHz,
    // A rendered file already carries the card's volume and level.
    volume: renderedUrl ? 1 : builtIn ? 0.8 : (record?.ambientVolume ?? 1),
    muted,
    trimDb: renderedUrl ? 0 : (record?.ambientGainDb ?? 0),
  });

  // Kept current for callbacks that outlive a render (timers, media keys).
  const live = useRef({ record, phase, playing, soundUrl, elapsed, finished });
  useEffect(() => {
    live.current = { record, phase, playing, soundUrl, elapsed, finished };
  });

  const stopAudio = useCallback(
    (fadeSeconds: number) => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      if (fadeSeconds <= 0) {
        audio.pause();
        return;
      }
      tunedSound.fadeOut(fadeSeconds);
      const src = audio.src;
      window.setTimeout(() => {
        if (audio.src === src) audio.pause();
      }, fadeSeconds * 1000);
    },
    [tunedSound],
  );

  const reset = useCallback(() => {
    window.clearTimeout(closingTimerRef.current);
    closingStartedRef.current = false;
    closingFadeStartedRef.current = false;
    switchingRef.current = false;
    setPhase("transition");
    setElapsed(0);
    setPlaying(false);
    setMuted(false);
    setAudioError(false);
    setFinished(false);
    setAacFailed(false);
    setRenderFailed(false);
    setDevToneHz(null);
    setDevTuningOff(false);
  }, []);

  const load = useCallback(
    (id: string, options: { resumeAt?: number } = {}) => {
      if (live.current.record?.id === id) return;
      const found = getPauseRecord(id) ?? null;
      // Another Pause was playing: it steps aside for this one.
      stopAudio(HANDOVER_FADE_SECONDS);
      reset();
      const resumeAt = found ? Math.min(Math.max(0, options.resumeAt ?? 0), found.durationSeconds - 1) : 0;
      setElapsed(resumeAt);
      const preferences = getPreferences();
      setFrequencyOn(preferences.soundToneLayerEnabled);
      setAmbientOn(preferences.soundAmbientEnabled);
      setUndertone(found?.undertone ?? preferences.undertone);
      setBuiltInSoundId(found?.builtInSoundId ?? null);
      setRecord(found);
      live.current = { ...live.current, record: found, phase: "transition", playing: false, finished: false, elapsed: resumeAt };
    },
    [reset, stopAudio],
  );

  const clear = useCallback(() => {
    stopAudio(0);
    audioRef.current?.removeAttribute("src");
    reset();
    setRecord(null);
    live.current = { ...live.current, record: null, phase: "transition", playing: false, finished: false };
  }, [reset, stopAudio]);

  // Only a Pause without "I'm ready" moves on by itself: the Ground Pause
  // after its brief "Get comfortable", Happening now at once.
  useEffect(() => {
    if (phase !== "transition" || !record || record.requiresArrive || finished) return;
    const delayMs = record.arrivalGuidance.length > 0 ? COMFORTABLE_SECONDS * 1000 : 0;
    const timer = window.setTimeout(() => {
      haptic("moment");
      setPhase("playing");
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [phase, record, finished]);


  // Start playback on entering the playing phase.
  useEffect(() => {
    if (phase !== "playing" || !record) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAudioError(false);
    const audio = audioRef.current;
    if (!soundUrl || !audio) {
      // Tone only: there is no file to load, so the Pause clock starts now.
      setPlaying(true);
      return;
    }
    // Already playing from letting it out: carry on, don't start over.
    if (!audio.paused && audio.src === new URL(soundUrl, window.location.href).href) {
      setPlaying(true);
      return;
    }
    audio.src = soundUrl;
    audio.loop = true;
    audio.currentTime = 0;
    tunedSound.resume();
    tunedSound.fadeIn(SOUND_FADE_IN_SECONDS);
    const startedWith = audio.src;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        if (audio.src !== startedWith) return;
        setAudioError(true);
        setPlaying(false);
      });
    // Only on entering "playing" for a given record: volume and mute are
    // applied by useTunedSound, not by restarting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, record]);

  // Switching between the rendered file and the live original mid-Pause
  // carries on from the same point.
  useEffect(() => {
    const audio = audioRef.current;
    if (phase !== "playing" || !audio || !soundUrl || !audio.src) return;
    if (audio.src === new URL(soundUrl, window.location.href).href) return;
    const wasPlaying = !audio.paused;
    const at = audio.currentTime;
    audio.src = soundUrl;
    audio.currentTime = at;
    if (!wasPlaying) return;
    tunedSound.resume();
    audio.play().catch(() => setAudioError(true));
  }, [phase, soundUrl, tunedSound]);

  // A rendered file that can't play: carry on with the next one instead of
  // showing an error (the Opus version, then the original tuned live).
  const handleAudioError = () => {
    const audio = audioRef.current;
    if (!audio || !audio.getAttribute("src")) return;
    const retryWith = (url: string) => {
      const at = audio.currentTime;
      audio.src = url;
      audio.currentTime = at;
      tunedSound.resume();
      audio
        .play()
        .then(() => {
          setAudioError(false);
          setPlaying(true);
        })
        .catch(() => {
          if (audio.src === new URL(url, window.location.href).href) setAudioError(true);
        });
    };
    const current = audio.src;
    const onRendering = new URL(current || "/", window.location.href).pathname.startsWith("/api/sounds/renders/");
    if (onRendering && !isWebmUrl(current)) {
      markAacUnplayable();
      setAacFailed(true);
      retryWith(webmUrl(current));
      return;
    }
    if (onRendering && originalUrl) {
      setRenderFailed(true);
      retryWith(originalUrl);
      return;
    }
    setAudioError(true);
  };

  const begin = useCallback(() => {
    if (!live.current.record) return;
    haptic("moment");
    setPhase("playing");
  }, []);

  const endEarly = useCallback(() => {
    haptic("tap");
    audioRef.current?.pause();
    window.clearTimeout(closingTimerRef.current);
    setPhase("checkin");
  }, []);

  // Natural completion: a brief quiet closing beat before the check-in.
  // Wherever you are in the app, the sound has already faded by now.
  const beginClosing = useCallback(() => {
    audioRef.current?.pause();
    haptic("moment");
    setPhase("closing");
    closingTimerRef.current = window.setTimeout(() => setPhase("checkin"), CLOSING_BEAT_MS);
  }, []);

  // Time actually listened, saved to the Pause record (lib/listening.ts):
  // Journey shows it, and a Practice day counts by it.
  const unsavedListeningRef = useRef(0);
  const saveListening = useCallback(() => {
    const seconds = unsavedListeningRef.current;
    const current = live.current.record;
    unsavedListeningRef.current = 0;
    if (!current || seconds <= 0) return;
    recordListening(current.id, seconds, live.current.elapsed);
    if (current.pauseType === "practice") settlePracticeDays();
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", saveListening);
    return () => window.removeEventListener("pagehide", saveListening);
  }, [saveListening]);

  // The Pause clock adds real elapsed time on each tick rather than
  // counting ticks: browsers slow timers in hidden tabs and on locked
  // phones. Time spent paused is excluded.
  useEffect(() => {
    if (phase !== "playing" || !playing || !record) return;
    let last = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - last) / 1000;
      last = now;
      unsavedListeningRef.current += Math.max(0, Math.min(delta, record.durationSeconds - live.current.elapsed));
      if (unsavedListeningRef.current >= LISTENING_SAVE_SECONDS) saveListening();
      setElapsed((current) => {
        const next = Math.min(record.durationSeconds, current + delta);
        // The end of the Pause: once (an updater can run twice in dev).
        if (next >= record.durationSeconds && !closingStartedRef.current) {
          closingStartedRef.current = true;
          window.setTimeout(beginClosing, 0);
        }
        return next;
      });
    }, 1000);
    return () => {
      window.clearInterval(interval);
      saveListening();
    };
  }, [phase, playing, record, beginClosing, saveListening]);

  // The closing fade starts once the remaining time is within it, at the
  // level the fade would have reached by then.
  useEffect(() => {
    if (phase !== "playing" || !playing || !record || !soundUrl || closingFadeStartedRef.current) return;
    const fadeSeconds = soundFadeOutSeconds(record);
    const remaining = Math.max(0, record.durationSeconds - elapsed);
    if (fadeSeconds > 0 && remaining <= fadeSeconds) {
      closingFadeStartedRef.current = true;
      tunedSound.fadeOut(remaining, (remaining / fadeSeconds) ** 2);
    }
  }, [phase, playing, record, soundUrl, elapsed, tunedSound]);

  // Always interactive, even after a load failure.
  const togglePlayback = useCallback(() => {
    const { record: current, playing: isPlaying, soundUrl: url, elapsed: at } = live.current;
    haptic("tap");
    if (!url) {
      setPlaying(!isPlaying);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      return;
    }
    if (!audio.getAttribute("src")) {
      audio.src = url;
      audio.loop = true;
    }
    tunedSound.resume();
    // Resuming inside the closing fade rejoins it where it left off.
    const fadeSeconds = current ? soundFadeOutSeconds(current) : 0;
    const remaining = current ? Math.max(0, current.durationSeconds - at) : Infinity;
    if (fadeSeconds > 0 && remaining <= fadeSeconds) {
      closingFadeStartedRef.current = true;
      tunedSound.fadeOut(remaining, (remaining / fadeSeconds) ** 2);
    } else tunedSound.fadeIn(SOUND_RESUME_FADE_SECONDS);
    audio
      .play()
      .then(() => setAudioError(false))
      .catch(() => setAudioError(true));
  }, [tunedSound]);

  const restart = useCallback(() => {
    if (!live.current.record) return;
    haptic("tap");
    closingFadeStartedRef.current = false;
    if (!live.current.soundUrl) {
      setElapsed(0);
      setPlaying(true);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setElapsed(0);
    tunedSound.resume();
    tunedSound.fadeIn(SOUND_FADE_IN_SECONDS);
    audio
      .play()
      .then(() => {
        setAudioError(false);
        setPlaying(true);
      })
      .catch(() => setAudioError(true));
  }, [tunedSound]);

  const toggleMute = useCallback(() => {
    haptic("tap");
    setMuted((current) => !current);
  }, []);

  // Switch the library sound live, carrying on without stopping the Pause.
  // The choice also becomes the default for the next Pause.
  const chooseSound = (id: BuiltInSoundId) => {
    haptic("tap");
    setBuiltInSoundId(id);
    // Picking a sound means you want to hear it, even with Ambient sound off.
    setAmbientOn(true);
    updatePreferences({ defaultSound: id, soundAmbientEnabled: true });
    const audio = audioRef.current;
    const nextUrl = soundUrlFor(findBuiltInSound(id), pauseHz);
    // Also while the sound plays ahead of the Pause: you choose by ear.
    if (!audio || (phase !== "playing" && audio.paused)) return;
    switchingRef.current = true;
    if (!nextUrl) {
      audio.pause();
      audio.removeAttribute("src");
      window.setTimeout(() => {
        switchingRef.current = false;
      }, 0);
      return;
    }
    audio.src = nextUrl;
    audio.loop = true;
    if (!playing) {
      switchingRef.current = false;
      return;
    }
    tunedSound.resume();
    tunedSound.fadeIn(SOUND_RESUME_FADE_SECONDS);
    audio
      .play()
      .catch(() => setAudioError(true))
      .finally(() => {
        switchingRef.current = false;
      });
  };

  // The Sound sheet's Tone: Off, or how present the frequency is. One
  // setting with You → Preferences → Frequency.
  const chooseTone = (tone: ToneSetting) => {
    haptic("tap");
    if (tone === "off") {
      setFrequencyOn(false);
      updatePreferences({ soundToneLayerEnabled: false });
      return;
    }
    setFrequencyOn(true);
    setUndertone(tone);
    updatePreferences({ soundToneLayerEnabled: true, undertone: tone });
  };

  const finish = useCallback(() => {
    stopAudio(0);
    setFinished(true);
    live.current = { ...live.current, finished: true };
  }, [stopAudio]);

  const release = useCallback(() => {
    const { finished: done, phase: now, playing: isPlaying } = live.current;
    const audio = audioRef.current;
    const soundAhead = Boolean(audio && !audio.paused);
    if (done || (now === "transition" && !isPlaying && !soundAhead)) clear();
  }, [clear]);

  // Lock screen and headphone controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const media = navigator.mediaSession;
    if (!record || finished) {
      media.metadata = null;
      media.playbackState = "none";
      return;
    }
    if (typeof MediaMetadata !== "undefined") {
      media.metadata = new MediaMetadata({
        title: plainTitle(record.title),
        artist: stops
          ? `${CENTRE_NAME[stops[stopIndex].chakraId]} · ${stops[stopIndex].hz} Hz`
          : [record.chakraName.replace(/ Chakra$/, ""), record.frequencyLabel].filter(Boolean).join(" · "),
        album: "Inner Pause",
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    }
    const play = () => {
      if (!live.current.playing) togglePlayback();
    };
    const pause = () => {
      if (live.current.playing) togglePlayback();
    };
    try {
      media.setActionHandler("play", play);
      media.setActionHandler("pause", pause);
    } catch {}
    return () => {
      try {
        media.setActionHandler("play", null);
        media.setActionHandler("pause", null);
      } catch {}
    };
  }, [record, finished, togglePlayback, stops, stopIndex]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !record || finished) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing, record, finished]);

  const value: PauseSession = {
    record,
    phase,
    elapsed,
    playing,
    muted,
    audioError,
    finished,
    frequencyOn,
    undertone,
    builtIn,
    builtInSoundId,
    stops,
    stopIndex,
    pauseHz,
    targetHz,
    hasSoundFile: Boolean(originalUrl),
    renderedFile: Boolean(renderedUrl),
    devTuningOff,
    backTo,
    load,
    begin,
    togglePlayback,
    restart,
    toggleMute,
    chooseSound,
    chooseTone,
    endEarly,
    finish,
    release,
    setDevToneHz,
    toggleDevTuning: () => setDevTuningOff((current) => !current),
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      {/* One element for the whole app, so the sound outlives any screen.
          crossOrigin keeps the tuning graph working if sounds are served
          from a separate API origin; same-origin is unaffected. */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => {
          if (!switchingRef.current) setPlaying(false);
        }}
        onError={handleAudioError}
      />
    </SessionContext.Provider>
  );
}

/** A centre's short name: "Heart", "Solar Plexus". */
export const CENTRE_NAME: Record<PauseStop["chakraId"], string> = {
  root: "Root",
  sacral: "Sacral",
  "solar-plexus": "Solar Plexus",
  heart: "Heart",
  throat: "Throat",
  "third-eye": "Third Eye",
  crown: "Crown",
};

// Copy rule (DESIGN_SYSTEM.md §14): no dashes in user-facing copy. Some
// stored titles predate the rule; show them with the centered dot instead.
export function plainTitle(title: string) {
  return title.replace(/\s+[—–-]\s+/g, " · ");
}

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** A session worth showing outside the player: started or playing, and not yet checked in. */
export function sessionIsActive(session: PauseSession) {
  return Boolean(session.record) && !session.finished;
}

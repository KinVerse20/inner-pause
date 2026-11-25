"use client";

import { useEffect, useRef, useState, ViewTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BreathingGuide, breathAt } from "@/components/breathing-guide";
import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { IconCheck, IconClose, IconPauseGlyph, IconPencil, IconPlayGlyph, IconRestart, IconSliders, IconVolumeOff, IconVolumeOn } from "@/components/pause-icons";
import { SoundSheet } from "@/components/sound-sheet";
import { WhyThisPausePanel } from "@/components/why-this-pause-panel";
import { haptic } from "@/lib/haptics";
import { createTellEntry, linkTellEntryToPause, NOT_ROUTED_INTERPRETATION } from "@/lib/tell-storage";
import {
  completePauseRecord,
  getPauseRecord,
  getPreviousCompletedPauseRecord,
  type PauseFeedback,
  type PauseRecord,
} from "@/lib/pause-storage";
import { getPreferences, updatePreferences } from "@/lib/preferences-store";
import { findBuiltInSound, soundUrlFor, undertoneGain, type BuiltInSoundId, type UndertoneLevel } from "@/lib/sound-library";
import { parseFrequencyHz, useToneLayer } from "@/lib/use-tone-layer";
import { isWebmUrl, markAacUnplayable, playableRenderUrl, webmUrl } from "@/lib/render-format";
import { useTunedSound } from "@/lib/use-tuned-sound";
import { expandName, markPageTransition } from "@/lib/view-transition";

// docs/PRODUCT_FLOW.md §4/§7: the center Pause action's "Get comfortable"
// transition is a fixed, brief moment — not a duration-scaled Arrive, and
// (unlike Arrive) it always auto-advances, never waits for confirmation.
const COMFORTABLE_SECONDS = 5;

// docs/PRODUCT_FLOW.md §10: a brief, quiet closing beat between playback
// ending and the check-in question — never a hard cut.
const CLOSING_BEAT_MS = 2600;

// A Pause's sound swells in gently rather than starting at full level, and
// eases back in after being paused.
const SOUND_FADE_IN_SECONDS = 10;
const SOUND_RESUME_FADE_SECONDS = 1.5;

// …and fades out over its final stretch instead of stopping. Sleep gets a
// long, slow fade so the end of the Pause never wakes anyone.
const SOUND_FADE_OUT_SECONDS = 10;
const SLEEP_FADE_OUT_SECONDS = 45;

function soundFadeOutSeconds(record: PauseRecord) {
  const seconds = record.outcomeId === "sleep" ? SLEEP_FADE_OUT_SECONDS : SOUND_FADE_OUT_SECONDS;
  return Math.min(seconds, Math.floor(record.durationSeconds / 4));
}

type Phase = "transition" | "playing" | "closing" | "checkin";
type CheckinStage = "question" | "same-options" | "not-better-options" | "acknowledged";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Deterministic playback-guidance cadence (docs/PRODUCT_FLOW.md §7): the
// session is divided into as many equal segments as there are cues, and the
// cue on screen advances once per segment — sparse, fixed points, never a
// running commentary.
function currentCueIndex(elapsed: number, durationSeconds: number, cueCount: number) {
  if (cueCount <= 1) return 0;
  const segment = durationSeconds / cueCount;
  return Math.min(cueCount - 1, Math.floor(elapsed / segment));
}

export function PausePlayerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  // What opened this Pause (a Home tile, the nav's Pause button): the
  // player grows out of it, and shrinks back into it on the way out.
  const from = searchParams.get("from");
  const audioRef = useRef<HTMLAudioElement>(null);

  const [record, setRecord] = useState<PauseRecord | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("transition");
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [notBetterStreak, setNotBetterStreak] = useState(false);
  const [checkinStage, setCheckinStage] = useState<CheckinStage>("question");
  const [acknowledgedText, setAcknowledgedText] = useState("");
  // Kinverse's "Anything you want to remember?" — an optional note saved to
  // the journal, linked to this Pause.
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  // You -> Preferences -> Ambient sound and Frequency. Read after mount:
  // preferences live in localStorage, which the server render can't see
  // (same reasoning as components/you-preferences-screen.tsx).
  const [frequencyOn, setFrequencyOn] = useState(false);
  const [ambientOn, setAmbientOn] = useState(true);
  // Built-in library sound (Kinverse) and undertone strength, switchable live
  // from the Sound sheet. Only used when the Pause plays a library sound.
  const [builtInSoundId, setBuiltInSoundId] = useState<BuiltInSoundId | null>(null);
  const [undertone, setUndertone] = useState<UndertoneLevel>("balanced");
  const [soundSheetOpen, setSoundSheetOpen] = useState(false);
  // Ignore the audio element's own pause event while we swap sources, so a
  // sound change never stops the Pause clock.
  const switchingRef = useRef(false);
  useEffect(() => {
    const preferences = getPreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrequencyOn(preferences.soundToneLayerEnabled);
    setAmbientOn(preferences.soundAmbientEnabled);
    setUndertone(preferences.undertone);
  }, []);

  // Dev-only frequency tester overrides (DevFrequencyTester below): a
  // chosen frequency replaces the Pause's own, and tuning can be switched
  // off to compare against the original recording.
  const [devToneHz, setDevToneHz] = useState<number | null>(null);
  const [devTuningOff, setDevTuningOff] = useState(false);

  // What a Pause plays: the sound the admin uploaded for its card (river,
  // rain…, chosen on the card's screen), tuned to the Pause's frequency so
  // the sound itself resonates at it — no separate tone. Normally that's
  // the file the server rendered (tuned, levelled, seamlessly looped, with
  // the card's volume applied); until it's ready, or while the dev tester
  // picks another frequency, the original is tuned live instead
  // (lib/use-tuned-sound.ts). The built-in chakra track (record.audioPath)
  // is no longer played. A Pause with no uploaded sound — or with Ambient
  // sound switched off — plays a soft tone at the frequency instead.
  const builtIn = Boolean(record?.builtInSoundId);
  const builtInSound = builtIn ? findBuiltInSound(builtInSoundId ?? record?.builtInSoundId) : undefined;
  const pauseHz = record ? parseFrequencyHz(record.frequencyLabel) : null;
  const originalUrl = ambientOn ? (builtIn ? soundUrlFor(builtInSound, pauseHz) : (record?.ambientSoundUrl ?? null)) : null;
  // A tuned recording already carries the frequency: no undertone on top.
  const premixed = Boolean(builtInSound?.tunedFile);
  const targetHz = devToneHz ?? (frequencyOn ? pauseHz : null);
  // Rendered files come as AAC and Opus (lib/render-format.ts). If one
  // can't play, the player falls back: AAC → Opus → the original, tuned
  // live (handleAudioError). The original also covers a Pause started
  // before its sound was re-rendered, whose files have since been replaced.
  const [aacFailed, setAacFailed] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);
  const rendering =
    devToneHz !== null || renderFailed || !ambientOn
      ? null
      : ((frequencyOn && !devTuningOff ? record?.ambientTunedUrl : record?.ambientPlainUrl) ?? null);
  const renderedUrl = rendering ? (aacFailed ? webmUrl(rendering) : playableRenderUrl(rendering)) : null;
  const soundUrl = renderedUrl ?? originalUrl;

  // Both follow playback exactly: audible only while the Pause is actually
  // playing and unmuted, fading out with the closing beat.
  // Library sounds keep their own pitch; the frequency sits beneath them as
  // an undertone at the chosen strength (Kinverse's model). Uploaded sounds
  // are tuned to the frequency instead, with the tone only when silent.
  useToneLayer(
    builtIn ? (premixed && originalUrl ? null : targetHz) : originalUrl ? null : targetHz,
    phase === "playing" && playing && !muted,
    builtIn && originalUrl ? undertoneGain(undertone) : undefined,
  );
  const tunedSound = useTunedSound(audioRef, {
    enabled: Boolean(originalUrl) && !renderedUrl,
    frequencyHz: renderedUrl || devTuningOff || builtIn ? null : targetHz,
    // A rendered file already carries the card's volume and level.
    volume: renderedUrl ? 1 : builtIn ? 0.8 : (record?.ambientVolume ?? 1),
    muted,
    trimDb: renderedUrl ? 0 : (record?.ambientGainDb ?? 0),
  });

  // One-time read from an external system (localStorage) on mount/id
  // change — there's no async boundary to defer into, since the read
  // itself is synchronous.
  useEffect(() => {
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecord(null);
      return;
    }
    const found = getPauseRecord(sessionId);
    setRecord(found ?? null);
    setBuiltInSoundId(found?.builtInSoundId ?? null);
    if (found) {
      setNotBetterStreak(getPreviousCompletedPauseRecord(found.id)?.feedback === "not-better");
    }
  }, [sessionId]);

  // Only the Ground Pause's brief "Get comfortable" transition auto-advances
  // (docs/PRODUCT_FLOW.md §4/§7). Full Arrive never auto-advances — it waits
  // for the explicit "I'm ready" action (handleReady below). Big Moments —
  // During has no arrival copy at all (lib/big-moment-engine.ts) and skips
  // the transition instantly rather than waiting out the brief window, per
  // §13's "near-zero friction... sound begins almost immediately."
  useEffect(() => {
    if (phase !== "transition" || !record || record.requiresArrive) return;
    const delayMs = record.arrivalGuidance.length > 0 ? COMFORTABLE_SECONDS * 1000 : 0;
    const timer = window.setTimeout(() => {
      haptic("moment");
      setPhase("playing");
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [phase, record]);

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
        // Already retrying with another file (handleAudioError).
        if (audio.src !== startedWith) return;
        setAudioError(true);
        setPlaying(false);
      });
    // Only re-run when entering "playing" for a given record — volume and
    // mute are applied by useTunedSound, not by restarting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, record]);

  // Switching between the rendered file and the live original mid-Pause
  // (a rendering became the choice, or the dev tester took over) carries on
  // from the same point.
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
  // showing an error — the Opus version, then the original tuned live.
  const handleAudioError = () => {
    const audio = audioRef.current;
    const retryWith = (url: string) => {
      if (!audio) return;
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
        // A failure here fires another error event, handled by this function.
        .catch(() => {
          if (audio.src === new URL(url, window.location.href).href) setAudioError(true);
        });
    };
    // Decided from what the element is actually playing, which is always
    // current (several errors can arrive before a re-render).
    const current = audio?.src ?? "";
    const onRendering = new URL(current || "/", window.location.href).pathname.startsWith("/api/sounds/renders/");
    if (audio && onRendering && !isWebmUrl(current)) {
      markAacUnplayable();
      setAacFailed(true);
      retryWith(webmUrl(current));
      return;
    }
    if (audio && onRendering && originalUrl) {
      setRenderFailed(true);
      retryWith(originalUrl);
      return;
    }
    setAudioError(true);
  };

  const handleReady = () => {
    if (!record) return;
    haptic("moment");
    setPhase("playing");
  };

  const finishToCheckin = () => {
    haptic("tap");
    audioRef.current?.pause();
    setPhase("checkin");
  };

  // Natural completion only: a brief quiet closing beat before check-in,
  // never a hard cut (docs/PRODUCT_FLOW.md §10). Manual exit skips straight
  // to check-in (docs/UX_ARCHITECTURE.md's Pause Player exit points).
  const beginClosing = () => {
    audioRef.current?.pause();
    haptic("moment");
    setPhase("closing");
    window.setTimeout(() => setPhase("checkin"), CLOSING_BEAT_MS);
  };

  // Session-duration timer, independent of the underlying track's own
  // length. It adds real elapsed time on each tick rather than counting
  // ticks: browsers slow or freeze timers in hidden tabs and on locked
  // phones, and a tick counter would then let the Pause run on long past
  // its length. Time spent paused is excluded.
  const closingStartedRef = useRef(false);
  useEffect(() => {
    if (phase !== "playing" || !playing || !record) return;
    let last = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - last) / 1000;
      last = now;
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
    return () => window.clearInterval(interval);
  }, [phase, playing, record]);

  // The closing fade starts once the remaining time is within it (time can
  // jump past any exact second after the tab was hidden), at the level the
  // fade would have reached by then.
  const closingFadeStartedRef = useRef(false);
  useEffect(() => {
    if (phase !== "playing" || !playing || !record || !soundUrl || closingFadeStartedRef.current) return;
    const fadeSeconds = soundFadeOutSeconds(record);
    const remaining = Math.max(0, record.durationSeconds - elapsed);
    if (fadeSeconds > 0 && remaining <= fadeSeconds) {
      closingFadeStartedRef.current = true;
      tunedSound.fadeOut(remaining, (remaining / fadeSeconds) ** 2);
    }
  }, [phase, playing, record, soundUrl, elapsed, tunedSound]);

  // Always interactive, even after a load failure — a failed placeholder
  // track should offer a retry, not a permanently dead control.
  const togglePlayback = () => {
    haptic("tap");
    if (!soundUrl) {
      setPlaying((current) => !current);
      return;
    }
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      return;
    }
    tunedSound.resume();
    // Resuming inside the closing fade rejoins it where it left off.
    const fadeSeconds = record ? soundFadeOutSeconds(record) : 0;
    const remaining = record ? Math.max(0, record.durationSeconds - elapsed) : Infinity;
    if (fadeSeconds > 0 && remaining <= fadeSeconds) {
      closingFadeStartedRef.current = true;
      tunedSound.fadeOut(remaining, (remaining / fadeSeconds) ** 2);
    } else tunedSound.fadeIn(SOUND_RESUME_FADE_SECONDS);
    audioRef.current
      .play()
      .then(() => setAudioError(false))
      .catch(() => setAudioError(true));
  };

  const handleRestart = () => {
    if (!record) return;
    haptic("tap");
    closingFadeStartedRef.current = false;
    if (!soundUrl) {
      setElapsed(0);
      setPlaying(true);
      return;
    }
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setElapsed(0);
    tunedSound.resume();
    tunedSound.fadeIn(SOUND_FADE_IN_SECONDS);
    audioRef.current
      .play()
      .then(() => {
        setAudioError(false);
        setPlaying(true);
      })
      .catch(() => setAudioError(true));
  };

  const toggleMute = () => {
    haptic("tap");
    setMuted(!muted);
  };

  // Switch the library sound live, carrying on without stopping the Pause.
  // The choice also becomes the default for the next Pause.
  const chooseSound = (id: BuiltInSoundId) => {
    haptic("tap");
    setBuiltInSoundId(id);
    updatePreferences({ defaultSound: id });
    const audio = audioRef.current;
    const nextUrl = ambientOn ? soundUrlFor(findBuiltInSound(id), pauseHz) : null;
    if (!audio || phase !== "playing") return;
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

  const chooseUndertone = (level: UndertoneLevel) => {
    haptic("tap");
    setUndertone(level);
    updatePreferences({ undertone: level });
  };

  // Leaving shrinks the player back into what opened it, with the page
  // you return to already in place beneath it (lib/view-transition.ts).
  const leaveTo = (destination: string) => {
    markPageTransition("hold");
    router.push(destination);
  };

  const finalizeAndLeave = (message: string, destination = "/") => {
    setAcknowledgedText(message);
    setCheckinStage("acknowledged");
    window.setTimeout(() => leaveTo(destination), 1400);
  };

  const handleTopChoice = (feedback: PauseFeedback) => {
    if (!record) return;
    haptic("success");
    saveNote();
    completePauseRecord(record.id, feedback);
    // A Pause inside a flow (a Practice day or skill session) always returns
    // to that flow, whatever the answer — the flow carries the next step.
    if (record.returnTo && record.pauseType === "practice") {
      finalizeAndLeave(feedback === "better" ? "Glad that helped." : "Thank you for noticing.", record.returnTo);
      return;
    }
    if (feedback === "better") {
      // Practice sessions resume at the Activity step after a helpful Pause
      // (lib/practice-engine.ts's `returnTo`); every other Pause type keeps
      // going Home exactly as before, since `returnTo` is undefined for them.
      finalizeAndLeave("Glad that helped.", record.returnTo ?? "/");
      return;
    }
    if (feedback === "same") {
      setCheckinStage("same-options");
      return;
    }
    setCheckinStage("not-better-options");
  };

  const saveNote = () => {
    if (!record || !note.trim()) return;
    const entry = createTellEntry({ text: note.trim(), source: "write", chips: [], interpretation: NOT_ROUTED_INTERPRETATION });
    linkTellEntryToPause(entry.id, record.id);
    setNote("");
  };

  const handleSkip = () => {
    if (!record) return;
    saveNote();
    completePauseRecord(record.id, undefined);
    leaveTo(record.returnTo ?? "/");
  };

  if (record === undefined) {
    return (
      <PlayerFrame from={from}>
        <div className="grid flex-1 place-items-center">
          <HarmonyFormVisual playing={false} dark className="ds-breathe w-[min(44vw,12rem)] opacity-70" />
          <p className="sr-only">Preparing your Pause</p>
        </div>
      </PlayerFrame>
    );
  }

  if (record === null) {
    return (
      <PlayerFrame from={from}>
        <div className="grid flex-1 place-items-center text-center">
          <div className="grid justify-items-center gap-4">
            <p className="text-base" style={{ color: "var(--ds-on-navy)" }}>We couldn&rsquo;t find that Pause.</p>
            <NavyButton onClick={() => leaveTo("/")}>Back to Home</NavyButton>
          </div>
        </div>
      </PlayerFrame>
    );
  }

  const progress = phase === "checkin" || phase === "closing" ? 1 : Math.min(1, elapsed / record.durationSeconds);
  const cueIndex = currentCueIndex(elapsed, record.durationSeconds, record.playbackCues.length);
  const currentCue = record.playbackCues[cueIndex];
  const closingCue = record.playbackCues[record.playbackCues.length - 1];
  const breath = breathAt(elapsed);
  const breathClass =
    phase !== "playing" || !playing || breath.kind === "message"
      ? "harmony-breath--rest"
      : breath.kind === "in"
        ? "harmony-breath--in"
        : "";
  const subtitle = [record.chakraName, record.frequencyLabel].filter(Boolean).join(" · ");

  return (
    <PlayerFrame from={from}>
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
        <button
          type="button"
          onClick={phase === "checkin" ? handleSkip : finishToCheckin}
          aria-label={phase === "checkin" ? "Close" : "End Pause"}
          className="ds-tap grid h-11 w-11 place-items-center rounded-full"
          style={{ color: "var(--ds-on-navy-muted)" }}
        >
          <IconClose className="h-5 w-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--ds-on-navy)" }}>
            {plainTitle(record.title)}
          </p>
          {subtitle ? (
            <p className="ds-caption truncate" style={{ color: "var(--ds-on-navy-muted)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <span className="h-11 w-11" aria-hidden="true" />
      </header>

      {phase === "transition" ? (
        <div className="grid flex-1 place-items-center text-center">
          <div className="grid justify-items-center">
            <div className="harmony-breath harmony-breath--rest">
              <HarmonyFormVisual playing={false} dark className="ds-breathe w-[min(56vw,16rem)]" />
            </div>
            <div className="mt-8 max-w-[18rem] space-y-1.5">
              {record.arrivalGuidance.map((line, index) => (
                <p
                  key={index}
                  className={index === 0 ? "text-lg font-semibold" : "text-sm leading-6"}
                  style={{ color: index === 0 ? "var(--ds-on-navy)" : "var(--ds-on-navy-muted)" }}
                >
                  {line}
                </p>
              ))}
            </div>
            {record.requiresArrive ? (
              <NavyButton onClick={handleReady} className="mt-8 px-8">
                I&rsquo;m ready
              </NavyButton>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === "playing" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className={`harmony-breath ${breathClass}`}>
            <HarmonyFormVisual playing={playing} progress={progress} dark className="w-[min(68vw,19rem)]" />
          </div>

          <BreathingGuide elapsed={elapsed} playing={playing} />

          <div className="min-h-[2.75rem] max-w-[17rem] space-y-1">
            {currentCue?.lines.map((line, index) => (
              <p
                key={`${cueIndex}-${index}`}
                className={`ds-settle ${index === 0 ? "text-[0.95rem] leading-6" : "text-sm leading-6"}`}
                style={{ color: index === 0 ? "var(--ds-on-navy)" : "var(--ds-on-navy-muted)" }}
              >
                {line}
              </p>
            ))}
          </div>

          <p className="ds-caption ds-num" style={{ color: "var(--ds-on-navy-muted)" }}>
            {formatTime(elapsed)} · {formatTime(Math.max(0, record.durationSeconds - elapsed))} left
          </p>

          {audioError ? (
            <p role="status" className="max-w-[18rem] text-xs leading-5" style={{ color: "#F2B8B0" }}>
              The sound couldn&rsquo;t load. Tap play to try again.
            </p>
          ) : null}

          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={handleRestart}
              aria-label="Start this Pause again"
              className="ds-tap grid h-12 w-12 place-items-center rounded-full"
              style={{ background: "rgba(248,250,252,0.1)", color: "var(--ds-on-navy)" }}
            >
              <IconRestart className="h-[1.1rem] w-[1.1rem]" />
            </button>

            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? "Pause" : audioError ? "Try playing again" : "Play"}
              className="ds-tap grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full"
              style={{ background: "var(--ds-on-navy)", color: "var(--ds-navy)", boxShadow: "0 10px 30px rgba(0,0,0,0.28)" }}
            >
              {playing ? <IconPauseGlyph className="h-7 w-7" /> : <IconPlayGlyph className="ml-0.5 h-7 w-7" />}
            </button>

            {builtIn ? (
              <button
                type="button"
                onClick={() => {
                  haptic("tap");
                  setSoundSheetOpen(true);
                }}
                aria-label="Sound"
                aria-haspopup="dialog"
                aria-expanded={soundSheetOpen}
                className="ds-tap grid h-12 w-12 place-items-center rounded-full"
                style={{ background: muted ? "rgba(248,250,252,0.22)" : "rgba(248,250,252,0.1)", color: "var(--ds-on-navy)" }}
              >
                {muted ? <IconVolumeOff className="h-[1.1rem] w-[1.1rem]" /> : <IconSliders className="h-[1.1rem] w-[1.1rem]" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Turn sound on" : "Mute"}
                aria-pressed={muted}
                className="ds-tap grid h-12 w-12 place-items-center rounded-full"
                style={{
                  background: muted ? "rgba(248,250,252,0.22)" : "rgba(248,250,252,0.1)",
                  color: "var(--ds-on-navy)",
                }}
              >
                {muted ? <IconVolumeOff className="h-[1.1rem] w-[1.1rem]" /> : <IconVolumeOn className="h-[1.1rem] w-[1.1rem]" />}
              </button>
            )}
          </div>

          {builtInSound ? (
            <p className="ds-caption -mt-2" style={{ color: "var(--ds-on-navy-muted)" }}>
              {builtInSound.label}
              {builtInSound.headphoneOnly ? " · best with headphones" : ""}
            </p>
          ) : null}

          <WhyThisPausePanel
            input={{
              chakraName: record.chakraName,
              traditionalAssociation: record.traditionalAssociation,
              frequencyLabel: record.frequencyLabel,
              intentLabel: record.intentLabel,
            }}
            dark
          />

          {process.env.NODE_ENV === "development" ? (
            <DevFrequencyTester
              pauseHz={pauseHz}
              currentHz={targetHz}
              tuningSound={Boolean(originalUrl)}
              rendered={Boolean(renderedUrl)}
              onChange={setDevToneHz}
              tuningOff={devTuningOff}
              onToggleTuning={() => setDevTuningOff((current) => !current)}
            />
          ) : null}
        </div>
      ) : null}

      {phase === "closing" ? (
        <div className="grid flex-1 place-items-center text-center">
          <div className="grid justify-items-center">
            <div className="harmony-breath harmony-breath--rest">
              <HarmonyFormVisual playing={false} progress={1} dark className="w-[min(68vw,19rem)]" />
            </div>
            <p className="ds-settle mt-8 max-w-[17rem] text-[0.95rem] leading-6" style={{ color: "var(--ds-on-navy)" }}>
              {closingCue?.lines[0] ?? "Take a moment before you go."}
            </p>
          </div>
        </div>
      ) : null}

      {phase === "checkin" ? (
        <div className="grid flex-1 place-items-center text-center">
          {checkinStage === "acknowledged" ? (
            <div className="ds-settle grid justify-items-center gap-5">
              <CompletionGlow />
              <p className="text-lg font-semibold" style={{ color: "var(--ds-on-navy)" }}>
                {acknowledgedText}
              </p>
            </div>
          ) : checkinStage === "question" ? (
            <div className="ds-settle grid w-full max-w-[22rem] justify-items-center gap-6">
              <CompletionGlow />
              <div className="space-y-2">
                <h1 className="ds-h1" style={{ color: "var(--ds-on-navy)" }}>
                  Welcome back.
                </h1>
                <p className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--ds-on-navy-muted)" }}>
                  <IconCheck className="h-4 w-4" />
                  {Math.max(1, Math.round(record.durationSeconds / 60))} minute Pause
                </p>
              </div>
              <div className="w-full space-y-3">
                <p className="text-base font-medium" style={{ color: "var(--ds-on-navy)" }}>
                  How do you feel now?
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <CheckinButton label="Better" onClick={() => handleTopChoice("better")} />
                  <CheckinButton label="Same" onClick={() => handleTopChoice("same")} />
                  <CheckinButton label="Not better" onClick={() => handleTopChoice("not-better")} />
                </div>
              </div>
              {noteOpen ? (
                <label className="ds-settle block w-full text-left">
                  <span className="ds-caption" style={{ color: "var(--ds-on-navy-muted)" }}>
                    Saved privately to your journal
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="A thought, a feeling, a small shift"
                    rows={3}
                    autoFocus
                    className="mt-1.5 w-full resize-none rounded-[var(--ds-radius-md)] px-4 py-3 text-[0.95rem] leading-6 outline-none"
                    style={{ background: "rgba(248,250,252,0.08)", color: "var(--ds-on-navy)", border: "1px solid rgba(248,250,252,0.16)" }}
                  />
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    haptic("tap");
                    setNoteOpen(true);
                  }}
                  className="ds-tap inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium"
                  style={{ color: "#C4B5FD" }}
                >
                  <IconPencil className="h-4 w-4" />
                  Add a few words
                </button>
              )}
              <button
                type="button"
                onClick={handleSkip}
                className="ds-tap inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium"
                style={{ color: "var(--ds-on-navy-muted)" }}
              >
                Skip for now
              </button>
            </div>
          ) : checkinStage === "same-options" ? (
            <div className="ds-settle w-full max-w-[20rem] space-y-4">
              <p className="text-base font-medium" style={{ color: "var(--ds-on-navy)" }}>What would help?</p>
              <div className="flex flex-col gap-2.5">
                <CheckinButton label="Try another Pause" onClick={() => finalizeAndLeave("Let's find another Pause.", "/")} wide />
                <CheckinButton label="Tell Inner Pause what's still going on" onClick={() => finalizeAndLeave("Tell Inner Pause what's on your mind.", "/tell")} wide />
              </div>
            </div>
          ) : (
            <div className="ds-settle w-full max-w-[20rem] space-y-4">
              <p className="text-base font-medium" style={{ color: "var(--ds-on-navy)" }}>
                {notBetterStreak ? "Let's try something different this time." : "That's alright. What would help?"}
              </p>
              <div className="flex flex-col gap-2.5">
                <CheckinButton label="Tell Inner Pause what's going on" onClick={() => finalizeAndLeave("Tell Inner Pause what's on your mind.", "/tell")} wide />
                {!notBetterStreak ? (
                  <CheckinButton label="Try a different Pause" onClick={() => finalizeAndLeave("Let's find a different Pause.", "/")} wide />
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {soundSheetOpen && builtIn ? (
        <SoundSheet
          currentId={builtInSoundId ?? record.builtInSoundId!}
          undertone={undertone}
          muted={muted}
          onChoose={chooseSound}
          onUndertone={chooseUndertone}
          onToggleMute={toggleMute}
          onClose={() => setSoundSheetOpen(false)}
        />
      ) : null}

      {/* crossOrigin keeps the tuning graph working if sounds are served
          from a separate API origin (NEXT_PUBLIC_API_URL); same-origin is unaffected. */}
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
    </PlayerFrame>
  );
}

// Traditional solfeggio-style values plus 432 Hz — the frequencies most
// often asked about, for quick comparison by ear.
const DEV_FREQUENCY_PRESETS = [174, 285, 396, 417, 432, 528, 639, 741, 852, 963];

// Dev-only, same convention as the dashed DEV panels in moments-screen.tsx
// and journey-screen.tsx: never rendered in production builds.
function DevFrequencyTester({
  pauseHz,
  currentHz,
  tuningSound,
  rendered,
  onChange,
  tuningOff,
  onToggleTuning,
}: {
  pauseHz: number | null;
  currentHz: number | null;
  /** True when the frequency tunes the selected sound; false when it plays as a tone. */
  tuningSound: boolean;
  /** True when playing the server's rendered file; false when tuning live. */
  rendered: boolean;
  onChange: (hz: number | null) => void;
  tuningOff: boolean;
  onToggleTuning: () => void;
}) {
  const shownHz = currentHz ?? pauseHz ?? 528;
  return (
    <section
      aria-label="Dev: frequency tester"
      className="w-full max-w-[20rem] space-y-2.5 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-left text-xs"
      style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
    >
      <p className="font-semibold">
        DEV · Frequency tester · <span className="tabular-nums">{Math.round(shownHz)} Hz</span>
        {currentHz === null ? " (off in Preferences)" : !tuningSound ? " · tone (no sound)" : tuningOff ? " · tuning off" : " · tuning the sound"}
        {tuningSound ? (rendered ? " · rendered file" : " · live") : ""}
      </p>
      <input
        type="range"
        min={100}
        max={1000}
        step={1}
        value={shownHz}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Frequency in hertz"
        className="w-full"
      />
      <div className="flex flex-wrap gap-1.5">
        {DEV_FREQUENCY_PRESETS.map((hz) => (
          <button
            key={hz}
            type="button"
            onClick={() => onChange(hz)}
            aria-pressed={Math.round(shownHz) === hz}
            className="ds-tap min-h-8 rounded-full border px-2.5 font-medium tabular-nums"
            style={{
              borderColor: Math.round(shownHz) === hz ? "var(--ds-accent)" : "var(--ds-border)",
              color: Math.round(shownHz) === hz ? "var(--ds-accent)" : undefined,
            }}
          >
            {hz}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ds-tap min-h-8 rounded-full border px-2.5 font-medium"
          style={{ borderColor: "var(--ds-border)" }}
        >
          Reset to this Pause{pauseHz ? ` (${pauseHz} Hz)` : ""}
        </button>
        {tuningSound ? (
          <button
            type="button"
            onClick={onToggleTuning}
            aria-pressed={tuningOff}
            className="ds-tap min-h-8 rounded-full border px-2.5 font-medium"
            style={{ borderColor: "var(--ds-border)" }}
          >
            {tuningOff ? "Hearing the original" : "Hearing it tuned"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

// Copy rule (DESIGN_SYSTEM.md §14): no em/en dashes in user-facing copy.
// Some stored titles predate the rule ("Difficult conversation — Stay
// steady"); render them with the centered-dot separator instead.
function plainTitle(title: string) {
  return title.replace(/\s+[—–-]\s+/g, " · ");
}

function NavyButton({ children, onClick, className = "" }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ds-tap inline-flex min-h-12 items-center justify-center rounded-full px-6 text-[0.95rem] font-semibold ${className}`}
      style={{ background: "var(--ds-on-navy)", color: "var(--ds-navy)" }}
    >
      {children}
    </button>
  );
}

function CheckinButton({ label, onClick, wide = false }: { label: string; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ds-tap min-h-12 rounded-full px-4 text-sm font-semibold ${wide ? "w-full" : ""}`}
      style={{ background: "rgba(248,250,252,0.12)", color: "var(--ds-on-navy)", border: "1px solid rgba(248,250,252,0.14)" }}
    >
      {label}
    </button>
  );
}

// The end of the brand story ("You return to yourself", BRAND_IDENTITY.md
// Harmony Form board): after the session the rings settle into one quiet,
// glowing center. Peak-end: the last thing felt is calm, not a scoreboard.
function CompletionGlow() {
  return (
    <div className="relative grid h-28 w-28 place-items-center" aria-hidden="true">
      <span
        className="ds-breathe absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(196,181,253,0.55) 0%, rgba(124,106,237,0.22) 42%, transparent 70%)" }}
      />
      <span className="h-3 w-3 rounded-full" style={{ background: "var(--ds-on-navy)", boxShadow: "0 0 24px 6px rgba(196,181,253,0.6)" }} />
    </div>
  );
}

function PlayerFrame({ from, children }: { from: string | null; children: ReactNode }) {
  // The app template already fades every page in, so no entrance of its own.
  const frame = (
    <div
      className="flex min-h-dvh flex-col overflow-x-hidden px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      style={{
        background: "radial-gradient(120% 70% at 50% 38%, #262357 0%, var(--ds-navy) 62%)",
        color: "var(--ds-on-navy)",
        fontFamily: "var(--ds-font-sans)",
        colorScheme: "dark",
      }}
    >
      {children}
    </div>
  );
  if (!from) return frame;
  return (
    <ViewTransition name={expandName(from)} share="expand" default="none">
      {frame}
    </ViewTransition>
  );
}

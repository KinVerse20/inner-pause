"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { LandscapeScene } from "@/components/landscape-scene";
import { IconCheck, IconClose, IconPauseGlyph, IconPlayGlyph, IconRestart, IconVolumeOff, IconVolumeOn } from "@/components/pause-icons";
import { WhyThisPausePanel } from "@/components/why-this-pause-panel";
import {
  completePauseRecord,
  getPauseRecord,
  getPreviousCompletedPauseRecord,
  type PauseFeedback,
  type PauseRecord,
} from "@/lib/pause-storage";
import { getPreferences } from "@/lib/preferences-store";
import { parseFrequencyHz, useToneLayer } from "@/lib/use-tone-layer";
import { isWebmUrl, markAacUnplayable, playableRenderUrl, webmUrl } from "@/lib/render-format";
import { useTunedSound } from "@/lib/use-tuned-sound";

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
  const sessionId = useSearchParams().get("session");
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
  // You -> Preferences -> Ambient sound and Frequency. Read after mount:
  // preferences live in localStorage, which the server render can't see
  // (same reasoning as components/you-preferences-screen.tsx).
  const [frequencyOn, setFrequencyOn] = useState(false);
  const [ambientOn, setAmbientOn] = useState(true);
  useEffect(() => {
    const preferences = getPreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrequencyOn(preferences.soundToneLayerEnabled);
    setAmbientOn(preferences.soundAmbientEnabled);
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
  const originalUrl = ambientOn ? (record?.ambientSoundUrl ?? null) : null;
  const pauseHz = record ? parseFrequencyHz(record.frequencyLabel) : null;
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
  useToneLayer(originalUrl ? null : targetHz, phase === "playing" && playing && !muted);
  const tunedSound = useTunedSound(audioRef, {
    enabled: Boolean(originalUrl) && !renderedUrl,
    frequencyHz: renderedUrl || devTuningOff ? null : targetHz,
    // A rendered file already carries the card's volume and level.
    volume: renderedUrl ? 1 : (record?.ambientVolume ?? 1),
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
    const timer = window.setTimeout(() => setPhase("playing"), delayMs);
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
    setPhase("playing");
  };

  const finishToCheckin = () => {
    audioRef.current?.pause();
    setPhase("checkin");
  };

  // Natural completion only: a brief quiet closing beat before check-in,
  // never a hard cut (docs/PRODUCT_FLOW.md §10). Manual exit skips straight
  // to check-in (docs/UX_ARCHITECTURE.md's Pause Player exit points).
  const beginClosing = () => {
    audioRef.current?.pause();
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
    setMuted(!muted);
  };

  const finalizeAndLeave = (message: string, destination = "/") => {
    setAcknowledgedText(message);
    setCheckinStage("acknowledged");
    window.setTimeout(() => router.push(destination), 900);
  };

  const handleTopChoice = (feedback: PauseFeedback) => {
    if (!record) return;
    completePauseRecord(record.id, feedback);
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

  const handleSkip = () => {
    if (!record) return;
    completePauseRecord(record.id, undefined);
    router.push(record.returnTo ?? "/");
  };

  if (record === undefined) {
    return <PlayerFrame><p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>Preparing your Pause…</p></PlayerFrame>;
  }

  if (record === null) {
    return (
      <PlayerFrame>
        <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>We couldn&rsquo;t find that Pause.</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="ds-filled ds-tap mt-4 min-h-11 px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
        >
          Back to Home
        </button>
      </PlayerFrame>
    );
  }

  const progress = phase === "checkin" || phase === "closing" ? 1 : Math.min(1, elapsed / record.durationSeconds);
  const cueIndex = currentCueIndex(elapsed, record.durationSeconds, record.playbackCues.length);
  const currentCue = record.playbackCues[cueIndex];
  const closingCue = record.playbackCues[record.playbackCues.length - 1];

  return (
    <PlayerFrame>
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={finishToCheckin}
          aria-label="Exit Pause"
          className="ds-tap grid h-11 w-11 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          style={{ color: "var(--ds-text-secondary)" }}
        >
          <IconClose className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{record.title}</p>
        </div>
        <span className="h-11 w-11" aria-hidden="true" />
      </header>

      {phase === "transition" ? (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <HarmonyFormVisual playing={false} className="mx-auto w-[min(52vw,15rem)]" />
            <div className="mt-6 space-y-1.5">
              {record.arrivalGuidance.map((line, index) => (
                <p key={index} className="text-base font-medium">
                  {line}
                </p>
              ))}
            </div>
            {record.requiresArrive ? (
              <button
                type="button"
                onClick={handleReady}
                className="ds-filled ds-tap mt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                I&rsquo;m ready
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === "playing" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <HarmonyFormVisual playing={playing} progress={progress} className="w-[min(64vw,18rem)]" />

          <div className="max-w-[16rem] space-y-1">
            {currentCue?.lines.map((line, index) => (
              <p
                key={index}
                className={index === 0 ? "text-base font-semibold" : "text-sm"}
                style={{ color: index === 0 ? "var(--ds-text)" : "var(--ds-text-secondary)" }}
              >
                {line}
              </p>
            ))}
          </div>

          <p className="text-xs tabular-nums" style={{ color: "var(--ds-text-muted)" }}>
            {formatTime(elapsed)} · {formatTime(Math.max(0, record.durationSeconds - elapsed))} left
          </p>

          {audioError ? (
            <p className="max-w-[18rem] text-xs" style={{ color: "#D97B70" }}>
              This Pause&rsquo;s sound couldn&rsquo;t load. Tap play to try again.
            </p>
          ) : null}

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleRestart}
              aria-label="Restart Pause"
              className="ds-icon-btn ds-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
            >
              <IconRestart className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? "Pause playback" : audioError ? "Retry playback" : "Resume playback"}
              className="ds-filled ds-tap grid h-16 w-16 place-items-center !min-h-16 !px-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {playing ? <IconPauseGlyph className="h-6 w-6" /> : <IconPlayGlyph className="h-6 w-6" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
              className="ds-icon-btn ds-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
            >
              {muted ? <IconVolumeOff className="h-4 w-4" /> : <IconVolumeOn className="h-4 w-4" />}
            </button>
          </div>

          <WhyThisPausePanel
            input={{
              chakraName: record.chakraName,
              traditionalAssociation: record.traditionalAssociation,
              frequencyLabel: record.frequencyLabel,
              intentLabel: record.intentLabel,
            }}
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
          <div>
            <HarmonyFormVisual playing={false} progress={1} className="mx-auto w-[min(64vw,18rem)]" />
            <p className="mt-6 max-w-[16rem] text-sm" style={{ color: "var(--ds-text-secondary)" }}>
              {closingCue?.lines[0] ?? ""}
            </p>
          </div>
        </div>
      ) : null}

      {phase === "checkin" ? (
        <div className="grid flex-1 place-items-center text-center">
          {checkinStage === "acknowledged" ? (
            <CompletionCard
              title="Well done"
              body={acknowledgedText}
              durationSeconds={record.durationSeconds}
            />
          ) : checkinStage === "question" ? (
            <div className="w-full max-w-[22rem] space-y-5">
              <CompletionCard
                title="Well done"
                body="You took a moment for you."
                durationSeconds={record.durationSeconds}
              />
              <p className="text-lg font-semibold">How do you feel now?</p>
              <div className="grid grid-cols-3 gap-2.5">
                <CheckinButton label="Better" onClick={() => handleTopChoice("better")} />
                <CheckinButton label="Same" onClick={() => handleTopChoice("same")} />
                <CheckinButton label="Not better" onClick={() => handleTopChoice("not-better")} />
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="ds-tap inline-flex min-h-11 items-center px-3 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ color: "var(--ds-text-muted)" }}
              >
                Skip
              </button>
            </div>
          ) : checkinStage === "same-options" ? (
            <div className="w-full max-w-[20rem] space-y-4">
              <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>What would help?</p>
              <div className="flex flex-col gap-2.5">
                <CheckinButton label="Try another Pause" onClick={() => finalizeAndLeave("Let's find another Pause.", "/")} wide />
                <CheckinButton label="Tell Inner Pause what's still going on" onClick={() => finalizeAndLeave("Tell Inner Pause what's on your mind.", "/tell")} wide />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[20rem] space-y-4">
              <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
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

      {/* crossOrigin keeps the tuning graph working if sounds are served
          from a separate API origin (NEXT_PUBLIC_API_URL); same-origin is unaffected. */}
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
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
        DEV — Frequency tester · <span className="tabular-nums">{Math.round(shownHz)} Hz</span>
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

function CheckinButton({ label, onClick, wide = false }: { label: string; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${wide ? "ds-outlined w-full" : "ds-tonal"} ds-tap min-h-11 px-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
    >
      {label}
    </button>
  );
}

function CompletionCard({
  title,
  body,
  durationSeconds,
}: {
  title: string;
  body: string;
  durationSeconds: number;
}) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return (
    <div className="ds-card ds-settle w-full overflow-hidden text-center">
      <div className="relative h-36">
        <LandscapeScene variant="complete" className="absolute inset-0 h-full w-full" />
      </div>
      <div className="space-y-3 px-5 py-5">
        <h2 className="ds-display text-[1.85rem]">{title}</h2>
        <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
          {body}
        </p>
        <p
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
        >
          <IconCheck className="h-3.5 w-3.5" />
          {minutes} min Pause completed
        </p>
        <p className="text-[0.8rem] leading-5" style={{ color: "var(--ds-text-muted)" }}>
          Small pauses create a calmer, stronger you.
        </p>
      </div>
    </div>
  );
}

function PlayerFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="ds-page-enter flex min-h-dvh flex-col overflow-x-hidden px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}
    >
      {children}
    </div>
  );
}

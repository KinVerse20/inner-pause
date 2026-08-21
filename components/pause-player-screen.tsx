"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { IconClose, IconPauseGlyph, IconPlayGlyph, IconRestart, IconVolumeOff, IconVolumeOn } from "@/components/pause-icons";
import { WhyThisPausePanel } from "@/components/why-this-pause-panel";
import {
  completePauseRecord,
  getPauseRecord,
  getPreviousCompletedPauseRecord,
  type PauseFeedback,
  type PauseRecord,
} from "@/lib/pause-storage";

// docs/PRODUCT_FLOW.md §4/§7: the center Pause action's "Get comfortable"
// transition is a fixed, brief moment — not a duration-scaled Arrive, and
// (unlike Arrive) it always auto-advances, never waits for confirmation.
const COMFORTABLE_SECONDS = 5;

// docs/PRODUCT_FLOW.md §10: a brief, quiet closing beat between playback
// ending and the check-in question — never a hard cut.
const CLOSING_BEAT_MS = 2600;

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
    if (phase !== "playing" || !record || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = record.audioPath;
    audio.loop = true;
    audio.currentTime = 0;
    audio.muted = muted;
    setAudioError(false);
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        setAudioError(true);
        setPlaying(false);
      });
    // Only re-run when entering "playing" for a given record — muted is
    // applied via toggleMute directly on the element, not by restarting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, record]);

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

  // Session-duration timer, independent of the underlying track's own length.
  useEffect(() => {
    if (phase !== "playing" || !playing || !record) return;
    const interval = window.setInterval(() => {
      setElapsed((current) => {
        const next = current + 1;
        if (next >= record.durationSeconds) {
          window.clearInterval(interval);
          beginClosing();
          return record.durationSeconds;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, playing, record]);

  // Always interactive, even after a load failure — a failed placeholder
  // track should offer a retry, not a permanently dead control.
  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      return;
    }
    audioRef.current
      .play()
      .then(() => setAudioError(false))
      .catch(() => setAudioError(true));
  };

  const handleRestart = () => {
    if (!audioRef.current || !record) return;
    audioRef.current.currentTime = 0;
    setElapsed(0);
    audioRef.current
      .play()
      .then(() => {
        setAudioError(false);
        setPlaying(true);
      })
      .catch(() => setAudioError(true));
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !muted;
    audioRef.current.muted = next;
    setMuted(next);
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
          className="ds-tap mt-4 min-h-11 rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
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
            <HarmonyFormVisual playing={false} dark className="mx-auto w-[min(52vw,15rem)]" />
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
                className="ds-tap mt-6 min-h-11 rounded-full px-7 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: "rgba(248,250,252,0.12)", color: "#F8FAFC" }}
              >
                I&rsquo;m ready
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === "playing" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <HarmonyFormVisual playing={playing} progress={progress} dark className="w-[min(64vw,18rem)]" />

          <div className="max-w-[16rem] space-y-1">
            {currentCue?.lines.map((line, index) => (
              <p
                key={index}
                className={index === 0 ? "text-sm" : "text-xs"}
                style={{ color: index === 0 ? "rgba(248,250,252,0.85)" : "rgba(248,250,252,0.65)" }}
              >
                {line}
              </p>
            ))}
          </div>

          <p className="text-xs tabular-nums" style={{ color: "rgba(248,250,252,0.65)" }}>
            {formatTime(elapsed)} · {formatTime(Math.max(0, record.durationSeconds - elapsed))} left
          </p>

          {audioError ? (
            <p className="max-w-[18rem] text-xs" style={{ color: "#D97B70" }}>
              This Pause&rsquo;s audio couldn&rsquo;t play — temporary/placeholder audio, not final production content. Tap play to try again.
            </p>
          ) : null}

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleRestart}
              aria-label="Restart Pause"
              className="ds-tap grid h-11 w-11 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: "rgba(248,250,252,0.1)", color: "rgba(248,250,252,0.8)" }}
            >
              <IconRestart className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? "Pause playback" : audioError ? "Retry playback" : "Resume playback"}
              className="ds-tap grid h-16 w-16 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: "rgba(248,250,252,0.12)", color: "#F8FAFC" }}
            >
              {playing ? <IconPauseGlyph className="h-6 w-6" /> : <IconPlayGlyph className="h-6 w-6" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
              className="ds-tap grid h-11 w-11 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: "rgba(248,250,252,0.1)", color: "rgba(248,250,252,0.8)" }}
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
            dark
          />
        </div>
      ) : null}

      {phase === "closing" ? (
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <HarmonyFormVisual playing={false} progress={1} dark className="mx-auto w-[min(64vw,18rem)]" />
            <p className="mt-6 max-w-[16rem] text-sm" style={{ color: "rgba(248,250,252,0.85)" }}>
              {closingCue?.lines[0] ?? ""}
            </p>
          </div>
        </div>
      ) : null}

      {phase === "checkin" ? (
        <div className="grid flex-1 place-items-center text-center">
          {checkinStage === "acknowledged" ? (
            <p className="text-base font-medium">{acknowledgedText}</p>
          ) : checkinStage === "question" ? (
            <div className="w-full max-w-[20rem] space-y-5">
              <p className="text-lg font-semibold">How do you feel now?</p>
              <div className="grid grid-cols-3 gap-2.5">
                <CheckinButton label="Better" onClick={() => handleTopChoice("better")} />
                <CheckinButton label="Same" onClick={() => handleTopChoice("same")} />
                <CheckinButton label="Not better" onClick={() => handleTopChoice("not-better")} />
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="ds-tap text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ color: "rgba(248,250,252,0.65)" }}
              >
                Skip
              </button>
            </div>
          ) : checkinStage === "same-options" ? (
            <div className="w-full max-w-[20rem] space-y-4">
              <p className="text-sm" style={{ color: "rgba(248,250,252,0.85)" }}>What would help?</p>
              <div className="flex flex-col gap-2.5">
                <CheckinButton label="Try another Pause" onClick={() => finalizeAndLeave("Let's find another Pause.", "/")} wide />
                <CheckinButton label="Tell Inner Pause what's still going on" onClick={() => finalizeAndLeave("Tell Inner Pause what's on your mind.", "/tell")} wide />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[20rem] space-y-4">
              <p className="text-sm" style={{ color: "rgba(248,250,252,0.85)" }}>
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

      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setAudioError(true)}
      />
    </PlayerFrame>
  );
}

function CheckinButton({ label, onClick, wide = false }: { label: string; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ds-tap min-h-11 rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${wide ? "w-full" : ""}`}
      style={{ background: "rgba(248,250,252,0.12)", color: "#F8FAFC" }}
    >
      {label}
    </button>
  );
}

function PlayerFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-dvh flex-col overflow-x-hidden px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      style={{ background: "#1D1B4C", color: "#F8FAFC", fontFamily: "var(--ds-font-sans)" }}
    >
      {children}
    </div>
  );
}

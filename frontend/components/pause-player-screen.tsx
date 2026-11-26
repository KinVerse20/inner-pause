"use client";

import { useEffect, useState, ViewTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BreathingGuide, breathVisual, ThoughtCard } from "@/components/breathing-guide";
import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { LetItOut } from "@/components/let-it-out";
import { IconCheck, IconChevronDown, IconClose, IconPauseGlyph, IconPencil, IconPlayGlyph, IconRestart, IconSliders, IconVolumeOff, IconVolumeOn } from "@/components/pause-icons";
import { formatTime, plainTitle, usePauseSession } from "@/components/pause-session";
import { SoundSheet } from "@/components/sound-sheet";
import { WhyThisPausePanel } from "@/components/why-this-pause-panel";
import { haptic } from "@/lib/haptics";
import { createTellEntry, linkTellEntryToMoment, linkTellEntryToPause, NOT_ROUTED_INTERPRETATION } from "@/lib/tell-storage";
import { listMomentRecords, updateMomentRecord, type MomentRecord } from "@/lib/moment-storage";
import { resumeAt } from "@/lib/listening";
import { completePauseRecord, getPauseRecord, getPreviousCompletedPauseRecord, type PauseFeedback } from "@/lib/pause-storage";
import { findBuiltInSound, UNDERTONE_LEVELS } from "@/lib/sound-library";
import { buildJourney } from "@/lib/breath-journey";
import { expandName, markPageTransition } from "@/lib/view-transition";

type CheckinStage = "question" | "same-options" | "not-better-options" | "acknowledged";

// The player: a view of the running Pause (components/pause-session.tsx).
// Leaving it, by the chevron or by going back, keeps the Pause playing; the
// mini player above the tab bar brings you back. The X ends the Pause.
export function PausePlayerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  // A Practice day picks up where you left off (lib/listening.ts).
  const resume = searchParams.get("resume") === "1";
  // What opened this Pause (a Home tile, the nav's Pause button): the
  // player grows out of it, and shrinks back into it on the way out.
  const from = searchParams.get("from");
  const session = usePauseSession();
  const { load, release } = session;

  // Not found is decided here; the session only holds Pauses that exist.
  const [missing, setMissing] = useState(false);
  const [notBetterStreak, setNotBetterStreak] = useState(false);
  const [checkinStage, setCheckinStage] = useState<CheckinStage>("question");
  const [acknowledgedText, setAcknowledgedText] = useState("");
  // Kinverse's "Anything you want to remember?": an optional note saved to
  // the journal, linked to this Pause.
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [soundSheetOpen, setSoundSheetOpen] = useState(false);
  const [moment, setMoment] = useState<MomentRecord | null>(null);

  // One-time read from localStorage on mount or id change.
  useEffect(() => {
    const found = sessionId ? getPauseRecord(sessionId) : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMissing(!found);
    if (!found) return;
    load(found.id, resume ? { resumeAt: resumeAt(found) } : undefined);
    // The Moment this Pause belongs to, if any (for letting it out first).
    setMoment(listMomentRecords().find((item) => item.linkedPauseRecordId === found.id) ?? null);
    setNotBetterStreak(getPreviousCompletedPauseRecord(found.id)?.feedback === "not-better");
  }, [sessionId, resume, load]);

  // Leaving the player keeps a started Pause playing; one that never
  // started, or is already checked in, is let go.
  useEffect(() => () => release(), [release]);

  const record = session.record && session.record.id === sessionId ? session.record : null;
  const { phase, elapsed, playing, muted, audioError, frequencyOn, undertone, builtIn } = session;
  const builtInSound = builtIn ? findBuiltInSound(session.builtInSoundId ?? record?.builtInSoundId) : undefined;

  // A Moment (coming up, just happened) offers letting it out first, with
  // its sound already playing. Happening now starts at once, so it doesn't.
  const offerLetOut = phase === "transition" && Boolean(record?.requiresArrive) && Boolean(moment) && moment?.mode !== "during";
  const { playAhead } = session;
  useEffect(() => {
    if (offerLetOut) playAhead();
    // Starts once per offer; later sound changes go through chooseSound.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerLetOut]);

  // What was let out stays with the Moment: in the journal, and as the
  // words on its polaroid in Journey. Nothing is analysed.
  const beginAfterLettingOut = (text: string, source: "write" | "speak") => {
    if (text && record && moment) {
      const entry = createTellEntry({ text, source, chips: [], interpretation: NOT_ROUTED_INTERPRETATION, momentMode: moment.mode });
      linkTellEntryToMoment(entry.id, moment.id);
      linkTellEntryToPause(entry.id, record.id);
      updateMomentRecord(moment.id, { expression: moment.expression ? `${moment.expression}

${text}` : text });
    }
    session.begin();
  };

  // Leaving shrinks the player back into what opened it, with the page
  // you return to already in place beneath it (lib/view-transition.ts).
  const leaveTo = (destination: string) => {
    markPageTransition("hold");
    router.push(destination);
  };

  // Minimise: back to where you were, the Pause carries on.
  const minimise = () => {
    haptic("tap");
    leaveTo(session.backTo);
  };

  const finalizeAndLeave = (message: string, destination = "/") => {
    setAcknowledgedText(message);
    setCheckinStage("acknowledged");
    session.finish();
    window.setTimeout(() => leaveTo(destination), 1400);
  };

  const handleTopChoice = (feedback: PauseFeedback) => {
    if (!record) return;
    haptic("success");
    saveNote();
    completePauseRecord(record.id, feedback);
    // A Pause inside a flow (a Practice day) always returns to that flow,
    // whatever the answer: the flow carries the next step.
    if (record.returnTo && record.pauseType === "practice") {
      finalizeAndLeave(feedback === "better" ? "Glad that helped." : "Thank you for noticing.", record.returnTo);
      return;
    }
    if (feedback === "better") {
      finalizeAndLeave("Glad that helped.", record.returnTo ?? "/");
      return;
    }
    session.finish();
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
    session.finish();
    leaveTo(record.returnTo ?? "/");
  };

  if (missing) {
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

  if (!record) {
    return (
      <PlayerFrame from={from}>
        <div className="grid flex-1 place-items-center">
          <HarmonyFormVisual playing={false} dark className="ds-breathe w-[min(44vw,12rem)] opacity-70" />
          <p className="sr-only">Preparing your Pause</p>
        </div>
      </PlayerFrame>
    );
  }

  const progress = phase === "checkin" || phase === "closing" ? 1 : Math.min(1, elapsed / record.durationSeconds);
  const closingCue = record.playbackCues[record.playbackCues.length - 1];
  // The guided journey (lib/breath-journey.ts): the Pause's own words are
  // what it says while resting, so there's one voice, not two.
  const journey = buildJourney(
    record.durationSeconds,
    record.playbackCues.slice(0, -1).map((cue) => cue.lines[0]).filter(Boolean),
  );
  const breath = breathVisual(journey, elapsed, phase === "playing" && playing);
  const subtitle = [record.chakraName, record.frequencyLabel].filter(Boolean).join(" · ");

  return (
    <PlayerFrame from={from}>
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
        <button
          type="button"
          onClick={phase === "checkin" ? handleSkip : session.endEarly}
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
        {phase === "playing" || (phase === "transition" && playing) ? (
          <button
            type="button"
            onClick={minimise}
            aria-label="Keep playing and go back"
            className="ds-tap grid h-11 w-11 place-items-center rounded-full"
            style={{ color: "var(--ds-on-navy-muted)" }}
          >
            <IconChevronDown className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden="true" />
        )}
      </header>

      {phase === "transition" ? (
        <div className="grid flex-1 place-items-center text-center">
          <div className="grid justify-items-center">
            <div className="harmony-breath harmony-breath--rest">
              <HarmonyFormVisual playing={offerLetOut} dark className={`ds-breathe ${offerLetOut ? "w-[min(40vw,10rem)]" : "w-[min(56vw,16rem)]"}`} />
            </div>
            {offerLetOut && moment ? (
              <div className="mt-6 w-full">
                <LetItOut
                  prompt={
                    moment.mode === "before"
                      ? "Speak or write whatever's on your mind about it. Nobody else will read this."
                      : "Get it off your chest, however it comes. Nobody else will read this."
                  }
                  onBegin={beginAfterLettingOut}
                />
              </div>
            ) : (
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
            )}
            {record.requiresArrive && !offerLetOut ? (
              <NavyButton onClick={session.begin} className="mt-8 px-8">
                I&rsquo;m ready
              </NavyButton>
            ) : null}
            {/* What you'll hear, set before you begin if you like (never a step you must take). */}
            {builtIn && builtInSound ? (
              <button
                type="button"
                onClick={() => {
                  haptic("tap");
                  setSoundSheetOpen(true);
                }}
                aria-haspopup="dialog"
                className="ds-tap mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[0.85rem]"
                style={{ color: "var(--ds-on-navy-muted)" }}
              >
                <IconSliders className="h-3.5 w-3.5" />
                {builtInSound.label} · {frequencyOn ? `${UNDERTONE_LEVELS.find((level) => level.id === undertone)?.label ?? "Balanced"} tone` : "no tone"}
                <span className="font-semibold" style={{ color: "#C4B5FD" }}>
                  Change
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === "playing" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className={`harmony-breath ${breath.className}`} style={{ transitionDuration: `${breath.seconds}s` }}>
            <HarmonyFormVisual playing={playing} progress={progress} dark className="w-[min(68vw,19rem)]" />
          </div>

          <BreathingGuide journey={journey} elapsed={elapsed} playing={playing} />

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
              onClick={session.restart}
              aria-label="Start this Pause again"
              className="ds-tap grid h-12 w-12 place-items-center rounded-full"
              style={{ background: "rgba(248,250,252,0.1)", color: "var(--ds-on-navy)" }}
            >
              <IconRestart className="h-[1.1rem] w-[1.1rem]" />
            </button>

            <button
              type="button"
              onClick={session.togglePlayback}
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
                onClick={session.toggleMute}
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

          <ThoughtCard journey={journey} elapsed={elapsed} playing={playing} />

          <WhyThisPausePanel
            input={{
              chakraName: record.chakraName,
              traditionalAssociation: record.traditionalAssociation,
              frequencyLabel: record.frequencyLabel,
              intentLabel: record.intentLabel,
            }}
            dark
            readMore
          />

          {process.env.NODE_ENV === "development" ? (
            <DevFrequencyTester
              pauseHz={session.pauseHz}
              currentHz={session.targetHz}
              tuningSound={session.hasSoundFile}
              rendered={session.renderedFile}
              onChange={session.setDevToneHz}
              tuningOff={session.devTuningOff}
              onToggleTuning={session.toggleDevTuning}
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
          currentId={session.builtInSoundId ?? record.builtInSoundId!}
          tone={frequencyOn ? undertone : "off"}
          frequencyLabel={record.frequencyLabel ?? null}
          muted={muted}
          onChoose={session.chooseSound}
          onTone={session.chooseTone}
          onToggleMute={session.toggleMute}
          onClose={() => setSoundSheetOpen(false)}
        />
      ) : null}

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

"use client";

// Guided breathing during a Pause — ported from Kinverse's
// ContinuousBreathingGuide (feature branch practice-guided-breathing-mindspace),
// rebuilt on our design system. Rhythm is unchanged: 4 seconds in, 6 seconds
// out, five breaths per minute; the last 10 seconds of every minute rest on
// one quiet line instead. The breath also drives the Harmony Form's scale
// (see usePauseBreath + .harmony-breath in app/globals.css), so the visual and
// the guidance are one thing, not two competing ones.
//
// Deliberately not an aria-live region: announcing "Breathe in / out" every
// few seconds would be noisy for screen-reader users during a calm session.

const INHALE_SECONDS = 4;
const CYCLE_SECONDS = 10;
const MESSAGE_FROM_SECOND = 50;

const BREATHING_MESSAGES = [
  "Nothing needs to be solved right now.",
  "Let your shoulders soften.",
  "You can meet this moment gently.",
  "There is room around every thought.",
  "Stay with the sound. Return to yourself.",
];

export type BreathState =
  | { kind: "in"; secondsLeft: number }
  | { kind: "out"; secondsLeft: number }
  | { kind: "message"; text: string };

export function breathAt(elapsedSeconds: number): BreathState {
  const whole = Math.max(0, Math.floor(elapsedSeconds));
  const inMinute = whole % 60;
  if (inMinute >= MESSAGE_FROM_SECOND) {
    return { kind: "message", text: BREATHING_MESSAGES[Math.floor(whole / 60) % BREATHING_MESSAGES.length] };
  }
  const inCycle = inMinute % CYCLE_SECONDS;
  return inCycle < INHALE_SECONDS
    ? { kind: "in", secondsLeft: INHALE_SECONDS - inCycle }
    : { kind: "out", secondsLeft: CYCLE_SECONDS - inCycle };
}

export function BreathingGuide({ elapsed, playing }: { elapsed: number; playing: boolean }) {
  const breath = breathAt(elapsed);
  const label = !playing
    ? "Breathing paused"
    : breath.kind === "in"
      ? "Breathe in"
      : breath.kind === "out"
        ? "Breathe out"
        : null;

  return (
    <section aria-label="Guided breathing" className="grid min-h-[3.25rem] place-items-center text-center">
      {breath.kind === "message" && playing ? (
        <p key={breath.text} className="ds-settle max-w-[17rem] text-sm leading-6" style={{ color: "var(--ds-on-navy-muted)" }}>
          {breath.text}
        </p>
      ) : (
        <div className="grid justify-items-center gap-1">
          <p key={label ?? ""} className="ds-settle text-[0.95rem] font-medium" style={{ color: "var(--ds-on-navy)" }}>
            {label}
          </p>
          <p className="ds-caption ds-num" style={{ color: "var(--ds-on-navy-muted)" }}>
            {playing && breath.kind !== "message" ? `${breath.secondsLeft}` : "4 in · 6 out"}
          </p>
        </div>
      )}
    </section>
  );
}

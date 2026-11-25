"use client";

import { STAGES, journeyAt, type JourneySegment } from "@/lib/breath-journey";

// The Pause's guide (lib/breath-journey.ts): one voice, one line at a
// time, never a ticking number. Above it, where you are on the journey.
// During breathing it says in or out and counts breaths, not seconds; the
// Harmony Form grows and settles with each breath (breathVisual).
//
// Deliberately not an aria-live region: announcing every line during a
// calm session would be noisy for screen-reader users.

/** How the Harmony Form should move right now: its class and how long the move takes. */
export function breathVisual(journey: JourneySegment[], elapsed: number, playing: boolean) {
  const { step } = journeyAt(journey, elapsed);
  if (!playing || (step.kind !== "in" && step.kind !== "out")) return { className: "harmony-breath--rest", seconds: 2.5 };
  return { className: step.kind === "in" ? "harmony-breath--in" : "", seconds: step.seconds };
}

export function BreathingGuide({ journey, elapsed, playing }: { journey: JourneySegment[]; elapsed: number; playing: boolean }) {
  const now = journeyAt(journey, elapsed);
  const { step } = now;
  // A key per segment, so each new line settles in on its own.
  const key = `${now.start}`;

  return (
    <section aria-label="Guided Pause" className="grid w-full max-w-[20rem] justify-items-center gap-3 text-center">
      <div className="grid justify-items-center gap-1.5" aria-hidden="true">
        <p className="ds-label uppercase tracking-[0.14em]" style={{ color: "var(--ds-on-navy-muted)" }}>
          {STAGES[now.stageIndex]?.label}
        </p>
        <span className="flex gap-1.5">
          {STAGES.map((stage, index) => (
            <span
              key={stage.id}
              className="h-1.5 rounded-full transition-[width,background-color] duration-700"
              style={{
                width: index === now.stageIndex ? "1.1rem" : "0.375rem",
                background: index <= now.stageIndex ? "#C4B5FD" : "rgba(248,250,252,0.18)",
              }}
            />
          ))}
        </span>
      </div>

      <div className="grid min-h-[4.5rem] place-items-center">
        {!playing ? (
          <p className="text-[0.95rem]" style={{ color: "var(--ds-on-navy-muted)" }}>
            Paused. Take your time.
          </p>
        ) : step.kind === "in" || step.kind === "out" ? (
          <div key={key} className="ds-settle grid justify-items-center gap-1">
            <p className="text-[1.3rem] font-semibold tracking-[-0.01em]" style={{ color: "var(--ds-on-navy)" }}>
              {step.kind === "in" ? "Breathe in" : "Breathe out"}
            </p>
            <p className="ds-caption ds-num" style={{ color: "var(--ds-on-navy-muted)" }}>
              {step.breath} of {step.of}
            </p>
          </div>
        ) : step.kind === "cue" ? (
          <p key={key} className="ds-settle text-[1.05rem] leading-7" style={{ color: "var(--ds-on-navy)" }}>
            {step.text}
          </p>
        ) : step.kind === "reminder" ? (
          // Something to hold, not something to do: softer, with a small mark.
          <div key={key} className="ds-settle grid justify-items-center gap-2">
            <span className="h-px w-6" style={{ background: "#C4B5FD", opacity: 0.7 }} aria-hidden="true" />
            <p className="text-[1.05rem] leading-7" style={{ color: "#DDD6FE" }}>
              {step.text}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

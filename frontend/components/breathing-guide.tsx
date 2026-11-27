"use client";

import { IconFeather } from "@/components/pause-icons";
import { STAGES, journeyAt, type JourneySegment } from "@/lib/breath-journey";

// The Pause's guide (lib/breath-journey.ts): one voice, one line at a
// time, never a ticking number. The gentle thoughts are not the guide:
// they have their own card below the controls (ThoughtCard). Above it, where you are on the journey.
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
        ) : null}
      </div>
    </section>
  );
}

// A gentle thought to hold, in its own place, so it never reads as the
// guide telling you what to do. It keeps its space while empty, and fades
// in and out instead of popping, so nothing on the screen jumps.
export function ThoughtCard({ journey, elapsed, playing }: { journey: JourneySegment[]; elapsed: number; playing: boolean }) {
  const { step } = journeyAt(journey, elapsed);
  const showing = playing && step.kind === "reminder";
  // The latest thought so far stays in place while it fades out.
  let text = "";
  for (const segment of journey) {
    if (segment.start > elapsed) break;
    if (segment.step.kind === "reminder") text = segment.step.text;
  }

  // Folds away between thoughts, so it never leaves an empty gap under the
  // controls; opening and closing glide (grid rows 0fr to 1fr).
  return (
    <div
      aria-hidden={!showing}
      className="grid w-full max-w-[20rem] transition-[grid-template-rows,opacity] duration-700 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: showing ? "1fr" : "0fr", opacity: showing ? 1 : 0 }}
    >
      <div className="overflow-hidden">
        <figure
          className="mt-5 flex items-center gap-3 rounded-[var(--ds-radius-lg)] px-4 py-3 text-left"
          style={{ background: "rgba(196,181,253,0.08)", boxShadow: "inset 0 0 0 1px rgba(196,181,253,0.16)" }}
        >
          <IconFeather className="h-4 w-4 shrink-0" style={{ color: "#C4B5FD" }} />
          <blockquote className="text-[0.95rem] italic leading-6" style={{ color: "#DDD6FE" }}>
            &ldquo;{text}&rdquo;
          </blockquote>
        </figure>
      </div>
    </div>
  );
}

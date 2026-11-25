"use client";

import type { ReactNode } from "react";

import type { Programme, ProgrammeDay } from "@/lib/programme-data";

// The two pieces of a path's preview (practice-path-screen.tsx, before you
// start): the day you've tapped on the trail, and what one day is made of.

export function DayPeek({ day, tone, total }: { day: ProgrammeDay; tone: string; total: number }) {
  const color = `var(--ds-outcome-${tone})`;
  return (
    <section
      key={day.day}
      aria-live="polite"
      className="ds-settle rounded-[var(--ds-radius-lg)] px-5 py-4"
      style={{ background: `color-mix(in srgb, ${color} 10%, var(--ds-surface))`, boxShadow: "var(--ds-elevation-1)" }}
    >
      <p className="ds-label uppercase" style={{ color: `color-mix(in srgb, ${color} 75%, var(--ds-text))` }}>
        Day {day.day} of {total} · {day.minutes} min
      </p>
      <h3 className="ds-h3 mt-1">{day.title}</h3>
      <p className="mt-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
        {day.intention}
      </p>
      <p className="mt-3 flex gap-2 text-[0.88rem] leading-6">
        <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
        <span>
          <span className="font-semibold">In real life: </span>
          {day.action}
        </span>
      </p>
    </section>
  );
}

export function DayAnatomy({ path, tone }: { path: Programme; tone: string }) {
  const first = path.days[0];
  const color = `var(--ds-outcome-${tone})`;
  const steps: Array<{ title: string; detail: string; meta: string; icon: ReactNode }> = [
    { title: "Check in", detail: first.checkInPrompt, meta: "1 min", icon: <path d="M5 19h4l10-10-4-4L5 15v4ZM13 7l4 4" /> },
    {
      title: "Listen and breathe",
      detail: "A guided Pause with your sound, tuned for this path.",
      meta: `${first.minutes} min · ${path.frequencyHz} Hz`,
      icon: <path d="M3 12c1.5 0 1.5-4 3-4s1.5 8 3 8 1.5-10 3-10 1.5 12 3 12 1.5-8 3-8 1.5 4 3 4" />,
    },
    { title: "One small action", detail: first.action, meta: "in your day", icon: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 12l3-3" /> },
    { title: "Reflect", detail: first.reflection, meta: "1 min", icon: <path d="M12 21c4.5-3 7-6.5 7-10a7 7 0 0 0-14 0c0 3.5 2.5 7 7 10Zm0-12v4" /> },
  ];
  return (
    <section aria-labelledby="anatomy-title" className="ds-card px-5 py-5">
      <h2 id="anatomy-title" className="ds-h3">
        A day on this path
      </h2>
      <p className="mt-0.5 text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
        5 to 10 minutes. Here&rsquo;s day 1.
      </p>
      <ol className="relative mt-4 space-y-4">
        <span className="absolute bottom-4 left-[1.125rem] top-4 w-px" style={{ background: `color-mix(in srgb, ${color} 35%, transparent)` }} aria-hidden="true" />
        {steps.map((step) => (
          <li key={step.title} className="relative flex gap-3.5">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{ background: `color-mix(in srgb, ${color} 20%, var(--ds-surface))`, color: `color-mix(in srgb, ${color} 85%, var(--ds-text))` }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-[1.1rem] w-[1.1rem]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                {step.icon}
              </svg>
            </span>
            <span className="min-w-0 pt-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[0.95rem] font-semibold">{step.title}</span>
                <span className="ds-caption ds-num">{step.meta}</span>
              </span>
              <span className="block text-[0.86rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

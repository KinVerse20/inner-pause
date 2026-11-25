"use client";

import { useLayoutEffect, useRef } from "react";

import { IconCheck } from "@/components/pause-icons";
import { haptic } from "@/lib/haptics";
import type { Programme } from "@/lib/programme-data";
import type { ProgrammeEnrollment } from "@/lib/programme-storage";

// A Practice path as a walk, side to side: 14 stops along a gently winding
// trail you swipe through, two weeks marked. Walked days are filled in,
// today glows (tap to begin), days ahead wait quietly; day 7 is Halfway,
// day 14 the flag. Opens with today (or the day you picked) in the middle.
// Before starting it's a preview: tap any stop to see that day.

const STEP = 88;
const PAD = 48;
const BASE_Y = 66;
const WAVE = 14;
const HEIGHT = 156;

export function PathTrail({
  path,
  enrollment,
  today,
  tone,
  onBeginToday,
  preview,
}: {
  path: Programme;
  enrollment: ProgrammeEnrollment | null;
  /** Today's day number, or null when the path is complete. */
  today: number | null;
  tone: string;
  onBeginToday: () => void;
  /** Before starting: each stop shows its day when tapped. */
  preview?: { selected: number; onSelect: (day: number) => void };
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const color = `var(--ds-outcome-${tone})`;
  const days = path.days;
  const width = PAD * 2 + STEP * (days.length - 1);
  const point = (index: number) => ({ x: PAD + index * STEP, y: BASE_Y + Math.sin(index * 0.85) * WAVE });
  const segment = (from: number, to: number) => {
    let d = "";
    for (let index = from; index <= to; index++) {
      const { x, y } = point(index);
      if (index === from) d += `M${x} ${y}`;
      else {
        const previous = point(index - 1);
        const mid = (previous.x + x) / 2;
        d += ` C${mid} ${previous.y} ${mid} ${y} ${x} ${y}`;
      }
    }
    return d;
  };
  const walked = enrollment?.completions.length ?? 0;
  const reachedIndex = preview ? 0 : Math.min(days.length - 1, today ? today - 1 : days.length - 1);
  const focusIndex = Math.max(0, (preview ? preview.selected : (today ?? days.length)) - 1);

  // Open with the day that matters in the middle.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = point(focusIndex).x - scroller.clientWidth / 2;
    // Only on open: later taps shouldn't yank the trail around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="path-trail-scroller -mx-2 overflow-x-auto overscroll-x-contain"
      role="group"
      aria-label={`${path.title}, ${walked} of ${days.length} days walked. Swipe to see every day.`}
    >
      <ol className="relative" style={{ width, height: HEIGHT }}>
        <svg className="absolute inset-0" width={width} height={HEIGHT} aria-hidden="true">
          {/* The two weeks, and where one becomes the other. */}
          <line x1={point(6).x + STEP / 2} x2={point(6).x + STEP / 2} y1="10" y2={HEIGHT - 10} stroke="color-mix(in srgb, var(--ds-text) 10%, transparent)" strokeDasharray="2 4" />
          <text x={PAD - 14} y="14" className="ds-label" fill="var(--ds-text-muted)" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
            WEEK 1
          </text>
          <text x={point(7).x - 14} y="14" className="ds-label" fill="var(--ds-text-muted)" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
            WEEK 2
          </text>
          <path d={segment(0, days.length - 1)} fill="none" stroke="color-mix(in srgb, var(--ds-text) 16%, transparent)" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" />
          {reachedIndex > 0 ? <path d={segment(0, reachedIndex)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.85" /> : null}
        </svg>

        {days.map((day, index) => {
          const { x, y } = point(index);
          const done = enrollment?.completions.some((entry) => entry.day === day.day) ?? false;
          const isToday = today === day.day;
          const selected = preview?.selected === day.day;
          const milestone = day.day === 7 ? "Halfway" : day.day === days.length ? "Finish" : null;
          const size = isToday ? 52 : milestone ? 44 : selected ? 42 : 38;
          const status = done ? "walked" : isToday ? "today" : "ahead";

          const node = (
            <span
              className={`grid place-items-center rounded-full ${isToday ? "ds-breathe" : ""}`}
              style={{
                width: size,
                height: size,
                background: done || isToday ? color : "var(--ds-surface)",
                color: done || isToday ? "var(--ds-surface)" : "var(--ds-text-muted)",
                boxShadow: isToday
                  ? `0 0 0 6px color-mix(in srgb, ${color} 22%, transparent), 0 8px 20px color-mix(in srgb, ${color} 35%, transparent)`
                  : selected
                    ? `inset 0 0 0 2px ${color}, 0 0 0 5px color-mix(in srgb, ${color} 18%, transparent)`
                    : done
                      ? "var(--ds-elevation-1)"
                      : `inset 0 0 0 1.5px color-mix(in srgb, var(--ds-text) 14%, transparent)`,
              }}
            >
              {done && !isToday ? (
                <IconCheck className="h-4 w-4" />
              ) : day.day === days.length ? (
                <FlagMark />
              ) : (
                <span className={`ds-num ${isToday ? "text-[1.05rem] font-bold" : "text-sm font-semibold"}`}>{day.day}</span>
              )}
            </span>
          );

          return (
            <li key={day.day} className="absolute grid justify-items-center" style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}>
              {isToday || milestone ? (
                <span
                  className="ds-label pointer-events-none absolute bottom-full mb-1.5 whitespace-nowrap rounded-full px-2 py-0.5 uppercase"
                  style={{ background: `color-mix(in srgb, ${color} 16%, var(--ds-surface))`, color: `color-mix(in srgb, ${color} 75%, var(--ds-text))` }}
                  aria-hidden="true"
                >
                  {isToday ? "Today" : milestone}
                </span>
              ) : null}
              {preview ? (
                <button
                  type="button"
                  onClick={() => {
                    haptic("tap");
                    preview.onSelect(day.day);
                  }}
                  aria-pressed={selected}
                  aria-label={`Day ${day.day}: ${day.title}`}
                  className="ds-tap block rounded-full"
                >
                  {node}
                </button>
              ) : isToday ? (
                <button
                  type="button"
                  onClick={() => {
                    haptic("tap");
                    onBeginToday();
                  }}
                  aria-label={`Begin day ${day.day}: ${day.title}`}
                  className="ds-tap block rounded-full"
                >
                  {node}
                </button>
              ) : (
                <span aria-label={`Day ${day.day}: ${day.title}, ${status}`} role="img" className="block">
                  {node}
                </span>
              )}
              <span
                className={`pointer-events-none absolute top-full mt-1.5 line-clamp-2 w-[5rem] text-center text-[0.72rem] leading-[0.95rem] ${isToday || selected ? "font-semibold" : "font-medium"}`}
                style={{ color: done || isToday || selected ? "var(--ds-text)" : "var(--ds-text-muted)" }}
                aria-hidden="true"
              >
                {day.title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FlagMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 21V4" />
      <path d="M6 4.5c4-2 7 2 12 0v8c-5 2-8-2-12 0" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

"use client";

import { IconCheck } from "@/components/pause-icons";
import { haptic } from "@/lib/haptics";
import type { Programme } from "@/lib/programme-data";
import type { ProgrammeEnrollment } from "@/lib/programme-storage";

// A Practice path as a walk: 14 stops along a winding trail. Walked days
// are filled in, today glows and can be tapped to begin, the days ahead
// wait quietly. Day 7 is the halfway mark, day 14 the flag at the end.
// The trail is solid where you've been and dotted where you're going.

const ROW = 84;
// Stop positions across the width (percent): a gentle S-curve down the page.
const X = [50, 70, 80, 72, 52, 30, 20, 28, 48, 70, 80, 70, 50, 50];

export function PathTrail({
  path,
  enrollment,
  today,
  tone,
  onBeginToday,
}: {
  path: Programme;
  enrollment: ProgrammeEnrollment;
  /** Today's day number, or null when the path is complete. */
  today: number | null;
  tone: string;
  onBeginToday: () => void;
}) {
  const color = `var(--ds-outcome-${tone})`;
  const days = path.days.slice(0, X.length);
  const height = days.length * ROW;
  const point = (index: number) => ({ x: X[index], y: index * ROW + ROW / 2 });
  const segment = (from: number, to: number) => {
    let d = "";
    for (let index = from; index <= to; index++) {
      const { x, y } = point(index);
      if (index === from) d += `M${x} ${y}`;
      else {
        const previous = point(index - 1);
        const mid = (previous.y + y) / 2;
        d += ` C${previous.x} ${mid} ${x} ${mid} ${x} ${y}`;
      }
    }
    return d;
  };
  const walked = enrollment.completions.length;
  const reachedIndex = Math.min(days.length - 1, today ? today - 1 : days.length - 1);

  return (
    <ol className="relative" style={{ height }} aria-label={`${path.title}, ${walked} of ${days.length} days walked`}>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={segment(0, days.length - 1)} fill="none" stroke="color-mix(in srgb, var(--ds-text) 16%, transparent)" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {reachedIndex > 0 ? (
          <path d={segment(0, reachedIndex)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.85" />
        ) : null}
      </svg>

      {days.map((day, index) => {
        const { x, y } = point(index);
        const done = enrollment.completions.some((entry) => entry.day === day.day);
        const isToday = today === day.day;
        const milestone = day.day === 7 ? "Halfway" : day.day === days.length ? "The whole path" : null;
        const labelLeft = x > 50;
        const size = isToday ? 56 : milestone ? 46 : 40;
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
          <li key={day.day} className="absolute" style={{ left: `${x}%`, top: y, transform: "translate(-50%, -50%)" }}>
            {isToday ? (
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
              className={`pointer-events-none absolute top-1/2 w-[min(38vw,10.5rem)] -translate-y-1/2 ${labelLeft ? "right-full mr-3 text-right" : "left-full ml-3 text-left"}`}
              aria-hidden="true"
            >
              {isToday || milestone ? (
                <span
                  className="ds-label mb-0.5 inline-block rounded-full px-2 py-0.5 uppercase"
                  style={{ background: `color-mix(in srgb, ${color} 16%, var(--ds-surface))`, color: `color-mix(in srgb, ${color} 75%, var(--ds-text))` }}
                >
                  {isToday ? "Today" : milestone}
                </span>
              ) : null}
              <span
                className={`block text-[0.8rem] leading-[1.15rem] ${isToday ? "font-semibold" : "font-medium"}`}
                style={{ color: done || isToday ? "var(--ds-text)" : "var(--ds-text-muted)" }}
              >
                {day.title}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
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

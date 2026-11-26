"use client";

import { useLayoutEffect, useRef, useState, ViewTransition } from "react";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { LandscapeScene } from "@/components/landscape-scene";
import { OutcomeEmblem } from "@/components/outcome-emblem";
import { IconCheck, IconPencil } from "@/components/pause-icons";
import { haptic } from "@/lib/haptics";
import type { Highlight } from "@/lib/journey-highlights";
import { getVisibleCards } from "@/lib/content-store";
import { composeCardPause, composeGroundPause } from "@/lib/pause-engine";
import { listenedSeconds, minutesLabel } from "@/lib/listening";
import { createPauseRecord, type PauseRecord } from "@/lib/pause-storage";
import { createTellEntry, NOT_ROUTED_INTERPRETATION, type TellEntry } from "@/lib/tell-storage";
import { viewTransitionsSupported, vtName } from "@/lib/view-transition";

// Journey as a journal (the product's core idea): one story, newest first,
// grouped by day. Your own words are keepsake cards, Moments are polaroids,
// Pauses are quiet lines on the thread, Practice days small marks.

const OUTCOME_LABEL: Record<string, string> = {
  sleep: "Sleep",
  reset: "Reset",
  focus: "Focus",
  confidence: "Confidence",
  calm: "Calm",
  release: "Release",
};

const FEEDBACK_LABEL = { better: "felt better", same: "felt the same", "not-better": "didn't help much" } as const;

const MODE_FROM_TIMING: Record<string, { label: string; landscape: "dawn" | "day" | "dusk"; tone: string }> = {
  Before: { label: "Coming up", landscape: "dawn", tone: "focus" },
  During: { label: "Happening now", landscape: "day", tone: "reset" },
  After: { label: "Just happened", landscape: "dusk", tone: "sleep" },
};

export type StoryItem =
  | { kind: "entry"; at: string; entry: TellEntry; pause?: PauseRecord }
  | { kind: "moment"; at: string; highlight: Highlight }
  | { kind: "practice"; at: string; highlight: Highlight }
  | { kind: "pause"; at: string; pause: PauseRecord };

export function buildStory(entries: TellEntry[], highlights: Highlight[], pauses: PauseRecord[]): StoryItem[] {
  const pauseById = new Map(pauses.map((pause) => [pause.id, pause]));
  const claimed = new Set<string>();
  const items: StoryItem[] = [];
  for (const highlight of highlights) {
    if (highlight.linkedPauseRecordId) claimed.add(highlight.linkedPauseRecordId);
    items.push({ kind: highlight.sourceType === "moment" ? "moment" : "practice", at: highlight.createdAt, highlight });
  }
  for (const entry of entries) {
    const pause = entry.linkedPauseRecordId ? pauseById.get(entry.linkedPauseRecordId) : undefined;
    if (pause) claimed.add(pause.id);
    items.push({ kind: "entry", at: entry.createdAt, entry, pause });
  }
  for (const pause of pauses) {
    if (!pause.completedAt || claimed.has(pause.id)) continue;
    items.push({ kind: "pause", at: pause.completedAt, pause });
  }
  return items.sort((a, b) => (a.at < b.at ? 1 : -1));
}

type StoryBlock = Exclude<StoryItem, { kind: "pause" }> | { kind: "pauses"; pauses: PauseRecord[] };

/** A day's Pauses side by side become one row of stamps. */
function toBlocks(items: StoryItem[]): StoryBlock[] {
  const blocks: StoryBlock[] = [];
  for (const item of items) {
    if (item.kind !== "pause") {
      blocks.push(item);
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === "pauses") last.pauses.push(item.pause);
    else blocks.push({ kind: "pauses", pauses: [item.pause] });
  }
  return blocks;
}

function dayKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

// A Moment with no named situation is titled by its timing ("After"); show
// the human mode label instead ("Just happened").
function momentTitle(highlight: Highlight) {
  return MODE_FROM_TIMING[highlight.title]?.label ?? highlight.title;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// Named by the time you actually spent in it.
function pauseName(pause: PauseRecord) {
  const outcome = pause.outcomeId ? OUTCOME_LABEL[pause.outcomeId] : null;
  const name = outcome ? `${outcome} Pause` : pause.title.replace(/\s+[—–-]\s+/g, " · ");
  return `${minutesLabel(listenedSeconds(pause))} ${name}`;
}

/* ------------------------------------------------------------------ */
/* Summary — the month in one human sentence, plus this week's rhythm */
/* ------------------------------------------------------------------ */

export function JourneySummary({ pauses, entries, moments }: { pauses: PauseRecord[]; entries: TellEntry[]; moments: number }) {
  // This calendar month (captured once per mount, so it's stable across re-renders).
  const [monthAgo] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime());
  const recent = pauses.filter((pause) => pause.completedAt && new Date(pause.completedAt).getTime() >= monthAgo);
  const recentEntries = entries.filter((entry) => new Date(entry.createdAt).getTime() >= monthAgo);
  const helped = new Map<string, number>();
  for (const pause of recent) {
    if (pause.feedback === "better" && pause.outcomeId) helped.set(pause.outcomeId, (helped.get(pause.outcomeId) ?? 0) + 1);
  }
  const best = [...helped.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const sentence =
    recent.length === 0 && recentEntries.length === 0
      ? "Your story begins with your first Pause or a few written words."
      : [
          recent.length ? `You paused ${recent.length} ${recent.length === 1 ? "time" : "times"} this month` : null,
          recentEntries.length ? `wrote ${recentEntries.length} ${recentEntries.length === 1 ? "entry" : "entries"}` : null,
        ]
          .filter(Boolean)
          .join(" and ")
          .replace(/^w/, "W") + ".";

  // This month as a trail: a stop for each day, glowing where you paused.
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    const key = dayKey(date.toISOString());
    return {
      key,
      day: index + 1,
      pauses: pauses.filter((pause) => pause.completedAt && dayKey(pause.completedAt) === key).length,
      wrote: entries.some((entry) => dayKey(entry.createdAt) === key),
      today: index + 1 === now.getDate(),
      future: index + 1 > now.getDate(),
    };
  });

  return (
    <section aria-label="Your month" className="ds-card ds-wash overflow-hidden px-5 pb-4 pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
          {now.toLocaleDateString(undefined, { month: "long" })}
        </p>
        <p className="ds-caption ds-num">
          {moments} {moments === 1 ? "moment" : "moments"}
        </p>
      </div>
      <p className="mt-2 text-[1.1rem] font-semibold leading-7">{sentence}</p>
      {best ? (
        <p className="mt-1 text-[0.92rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
          <span style={{ color: `var(--ds-outcome-${best})` }}>{OUTCOME_LABEL[best]}</span> has helped you most.
        </p>
      ) : null}
      <MonthTrail days={monthDays} />
    </section>
  );
}

function MonthTrail({ days }: { days: Array<{ key: string; day: number; pauses: number; wrote: boolean; today: boolean; future: boolean }> }) {
  const wave = (index: number) => Math.sin((index / (days.length - 1)) * Math.PI * 3) * 9;
  const path = days
    .map((_, index) => {
      const x = (index / (days.length - 1)) * 100;
      const y = 22 + wave(index);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const pausedDays = days.filter((day) => day.pauses > 0).length;
  return (
    <div className="relative mt-4 h-11" role="img" aria-label={`This month: you paused on ${pausedDays} ${pausedDays === 1 ? "day" : "days"}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
        <path d={path} fill="none" stroke="color-mix(in srgb, var(--ds-accent-secondary) 35%, transparent)" strokeWidth="1.5" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {days.map((day, index) => {
        const size = day.pauses === 0 ? 5 : Math.min(13, 7 + day.pauses * 2);
        return (
          <span
            key={day.key}
            className={`absolute rounded-full ${day.today ? "ds-breathe" : ""}`}
            aria-hidden="true"
            style={{
              left: `${(index / (days.length - 1)) * 100}%`,
              top: 22 + wave(index),
              width: size,
              height: size,
              transform: "translate(-50%, -50%)",
              background: day.pauses > 0 ? "var(--ds-accent-secondary)" : day.wrote ? "var(--ds-accent-soft)" : day.future ? "transparent" : "color-mix(in srgb, var(--ds-text) 14%, transparent)",
              boxShadow: day.today
                ? "0 0 0 3px var(--ds-surface), 0 0 0 4.5px var(--ds-accent)"
                : day.pauses > 0
                  ? "0 0 8px color-mix(in srgb, var(--ds-accent-secondary) 55%, transparent)"
                  : day.wrote
                    ? "inset 0 0 0 1.5px var(--ds-accent-secondary)"
                    : day.future
                      ? "inset 0 0 0 1px color-mix(in srgb, var(--ds-text) 14%, transparent)"
                      : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------ */
/* Composer — Kinverse's private journal, inline     */
/* ------------------------------------------------ */

export function JournalComposer({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    createTellEntry({ text: trimmed, source: "write", chips: [], interpretation: NOT_ROUTED_INTERPRETATION });
    haptic("success");
    setText("");
    setOpen(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
    onSaved();
  };

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            haptic("tap");
            setOpen(true);
          }}
          className="ds-tap ds-card flex w-full items-center gap-3.5 px-4 py-4 text-left"
        >
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
            aria-hidden="true"
          >
            <IconPencil className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="ds-h3 block">Write in your journal</span>
            <span className="block text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
              Private. Only you can read it.
            </span>
          </span>
        </button>
        {saved ? (
          <p role="status" className="ds-settle flex items-center gap-1.5 px-1 text-sm" style={{ color: "var(--ds-success)" }}>
            <IconCheck className="h-4 w-4" />
            Saved to your journal
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section aria-label="New journal entry" className="journal-paper ds-settle rounded-[var(--ds-radius-lg)] px-5 pb-4 pt-5">
      <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
        {today}
      </p>
      <textarea
        aria-label="Journal entry"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Whatever you need to put down…"
        rows={5}
        autoFocus
        className="journal-lines mt-2 w-full resize-none bg-transparent text-[1rem] leading-8 outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="ds-caption ds-num">{text.trim().length} characters</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              haptic("tap");
              setOpen(false);
            }}
            className="ds-tap min-h-11 rounded-full px-4 text-sm font-medium"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            Cancel
          </button>
          <button type="button" onClick={save} disabled={!text.trim()} className="ds-filled !min-h-11 !px-5">
            Save
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------ */
/* The story timeline                                */
/* ------------------------------------------------ */

export function StoryTimeline({
  items,
  openEntryId = null,
  onOpenEntry,
  onOpenHighlight,
}: {
  items: StoryItem[];
  /** The entry open in its sheet: its card is lifted out, leaving its space. */
  openEntryId?: string | null;
  onOpenEntry: (entry: TellEntry) => void;
  onOpenHighlight: (highlight: Highlight) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="ds-card grid justify-items-center gap-2 px-6 py-8 text-center">
        <p className="ds-h3">Nothing here yet</p>
        <p className="max-w-[17rem] text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
          Take a Pause or write a few words. Your story will gather here, one day at a time.
        </p>
      </div>
    );
  }

  const groups: Array<{ key: string; label: string; items: StoryItem[] }> = [];
  for (const item of items) {
    const key = dayKey(item.at);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: dayLabel(item.at), items: [item] });
  }

  let polaroidIndex = 0;
  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h2 className="ds-label sticky top-0 z-10 -mx-1 mb-3 px-1 py-1.5 uppercase" style={{ color: "var(--ds-text-secondary)", background: "var(--ds-bg)" }}>
            {group.label}
          </h2>
          <ol className="story-thread space-y-4">
            {toBlocks(group.items).map((item) => {
              if (item.kind === "pauses") {
                return (
                  <li key={`x-${item.pauses[0].id}`} className="story-node story-node--small">
                    <div className="flex flex-wrap gap-2 py-1">
                      {item.pauses.map((pause) => (
                        <PauseStamp key={pause.id} pause={pause} />
                      ))}
                    </div>
                  </li>
                );
              }
              if (item.kind === "entry") {
                return (
                  <li key={`e-${item.entry.id}`} className="story-node">
                    {/* Shares its name with the entry sheet (journey-screen.tsx): the
                        card grows into the sheet, and settles back on close. */}
                    {openEntryId === item.entry.id ? (
                      <div style={{ visibility: "hidden" }} aria-hidden="true">
                        <EntryCard item={item} onOpen={() => {}} />
                      </div>
                    ) : (
                      <ViewTransition name={vtName("entry", item.entry.id)} share="expand" default="none">
                        <EntryCard item={item} onOpen={() => onOpenEntry(item.entry)} />
                      </ViewTransition>
                    )}
                  </li>
                );
              }
              if (item.kind === "moment") {
                const tilt = polaroidIndex++ % 2 === 0 ? -0.8 : 0.7;
                return (
                  <li key={`m-${item.highlight.id}`} className="story-node">
                    <ViewTransition name={vtName("polaroid", item.highlight.id)} share="expand" default="none">
                      <PolaroidCard highlight={item.highlight} tilt={tilt} onOpen={() => onOpenHighlight(item.highlight)} />
                    </ViewTransition>
                  </li>
                );
              }
              if (item.kind === "practice") {
                return (
                  <li key={`p-${item.highlight.id}`} className="story-node story-node--small">
                    <button type="button" onClick={() => onOpenHighlight(item.highlight)} className="ds-tap w-full rounded-[var(--ds-radius-md)] px-3.5 py-3 text-left" style={{ background: "var(--ds-accent-soft)" }}>
                      <span className="ds-label uppercase" style={{ color: "var(--ds-accent)" }}>
                        Practice · {timeLabel(item.at)}
                      </span>
                      <span className="mt-0.5 block text-[0.95rem] font-medium leading-6">{item.highlight.title}</span>
                    </button>
                  </li>
                );
              }
              return null;
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function EntryCard({ item, onOpen }: { item: Extract<StoryItem, { kind: "entry" }>; onOpen: () => void }) {
  const { entry, pause } = item;
  const long = entry.text.length > 220;
  // Each keepsake carries the color of what it led to (or a quiet violet).
  const tint = pause?.outcomeId ? `var(--ds-outcome-${pause.outcomeId})` : "var(--ds-accent-secondary)";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="journal-paper ds-tap relative block w-full rounded-[var(--ds-radius-lg)] px-5 pb-4 pt-8 text-left"
      style={{ ["--paper-tint" as string]: tint }}
    >
      <span className="journal-tape" aria-hidden="true" />
      <svg viewBox="0 0 24 18" className="absolute left-4 top-3 h-4 w-5" style={{ color: tint, opacity: 0.55 }} aria-hidden="true">
        <path fill="currentColor" d="M0 18V10.6C0 4.9 2.9 1.4 8.6 0l1 2.1C6.5 3.2 5 5.2 4.9 8.2H9.5V18H0Zm14.5 0V10.6C14.5 4.9 17.4 1.4 23.1 0l.9 2.1c-3.1 1.1-4.6 3.1-4.7 6.1H24V18h-9.5Z" />
      </svg>
      <span className="block whitespace-pre-line text-[1rem] leading-7">{long ? `${entry.text.slice(0, 220).trimEnd()}…` : entry.text}</span>
      {entry.chips.length > 0 ? (
        <span className="mt-3 flex flex-wrap gap-1.5">
          {entry.chips.map((chip) => (
            <span key={chip} className="rounded-full px-2.5 py-1 text-[0.75rem] font-medium" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-text-secondary)" }}>
              {chip}
            </span>
          ))}
        </span>
      ) : null}
      <span className="ds-caption mt-3 flex flex-wrap items-center gap-x-1.5">
        <span>{entry.source === "speak" ? "Spoken" : "Written"}</span>
        <span>·</span>
        <span>{timeLabel(entry.createdAt)}</span>
        {pause ? (
          <>
            <span>·</span>
            <span>
              then {pauseName(pause)}
              {pause.feedback ? `, ${FEEDBACK_LABEL[pause.feedback]}` : ""}
            </span>
          </>
        ) : null}
      </span>
    </button>
  );
}

function PolaroidCard({ highlight, tilt, onOpen }: { highlight: Highlight; tilt: number; onOpen: () => void }) {
  const mode = MODE_FROM_TIMING[highlight.timingLabel] ?? MODE_FROM_TIMING.After;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="polaroid ds-tap block w-full max-w-[18.5rem] text-left"
      style={{ ["--tilt" as string]: `${tilt}deg` }}
    >
      <span className="relative block aspect-[16/9] overflow-hidden rounded-[0.4rem]" aria-hidden="true">
        <LandscapeScene variant={mode.landscape} className="absolute inset-0 h-full w-full scale-[1.25]" />
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold"
          style={{ background: "rgba(255,255,255,0.82)", color: "#1D1B4C" }}
        >
          {mode.label}
        </span>
      </span>
      <span className="block px-1.5 pb-1 pt-3">
        <span className="block text-[1.02rem] font-semibold leading-6">{momentTitle(highlight)}</span>
        {highlight.expression ? (
          <span className="mt-1 block text-[0.9rem] italic leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            &ldquo;{highlight.expression.length > 120 ? `${highlight.expression.slice(0, 120)}…` : highlight.expression}&rdquo;
          </span>
        ) : null}
        <span className="ds-caption mt-2 flex items-center gap-1.5">
          {timeLabel(highlight.createdAt)}
          {highlight.feedback ? (
            <>
              <span>·</span>
              <span>{FEEDBACK_LABEL[highlight.feedback]}</span>
            </>
          ) : null}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------ */
/* A Moment, opened: the polaroid picked up          */
/* ------------------------------------------------ */

export function MomentOpened({
  highlight,
  linkedEntries,
  onBack,
  onOpenEntry,
}: {
  highlight: Highlight;
  linkedEntries: TellEntry[];
  onBack: () => void;
  onOpenEntry: (entry: TellEntry) => void;
}) {
  const mode = MODE_FROM_TIMING[highlight.timingLabel];
  const when = new Date(highlight.createdAt);
  const returnNote = highlight.returnToMe;
  const otherEntries = linkedEntries.filter((entry) => entry.text.trim() !== highlight.expression?.trim());
  const ref = useRef<HTMLElement>(null);
  // Before paint, and instantly where the polaroid grows into place: a
  // smooth scroll would move the page out from under that animation.
  useLayoutEffect(() => {
    const instant = viewTransitionsSupported() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ block: "start", behavior: instant ? "auto" : "smooth" });
  }, []);
  return (
    <section ref={ref} className="ds-settle scroll-mt-4 space-y-5">
      <button
        type="button"
        onClick={() => {
          haptic("tap");
          onBack();
        }}
        className="ds-tap inline-flex min-h-11 items-center gap-1 rounded-full text-sm font-medium"
        style={{ color: "var(--ds-text-secondary)" }}
      >
        <span aria-hidden="true">‹</span> Your story
      </button>

      {mode ? (
        <ViewTransition name={vtName("polaroid", highlight.id)} share="expand" default="none">
        <figure className="polaroid mx-auto max-w-[22rem]" style={{ ["--tilt" as string]: "0deg" }}>
          <span className="relative block aspect-[4/3] overflow-hidden rounded-[0.4rem]" aria-hidden="true">
            <LandscapeScene variant={mode.landscape} className="absolute inset-0 h-full w-full scale-[1.2]" />
            <span className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold" style={{ background: "rgba(255,255,255,0.85)", color: "#1D1B4C" }}>
              {mode.label}
            </span>
          </span>
          <figcaption className="px-1.5 pb-1 pt-3.5">
            <span className="block text-[1.2rem] font-semibold leading-7">{momentTitle(highlight)}</span>
            <span className="ds-caption mt-1 block">
              {when.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · {timeLabel(highlight.createdAt)}
            </span>
          </figcaption>
        </figure>
        </ViewTransition>
      ) : (
        <div className="ds-card px-5 py-5">
          <p className="ds-label uppercase" style={{ color: "var(--ds-accent)" }}>Practice</p>
          <h1 className="ds-h2 mt-1">{highlight.title}</h1>
          <p className="ds-caption mt-1">{timeLabel(highlight.createdAt)}</p>
        </div>
      )}

      {highlight.expression ? (
        <div className="journal-paper relative rounded-[var(--ds-radius-lg)] px-5 pb-4 pt-6">
          <span className="journal-tape" aria-hidden="true" />
          <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>In your words</p>
          <p className="mt-1.5 text-[1rem] leading-7">{highlight.expression}</p>
        </div>
      ) : null}

      {highlight.feedback ? (
        <p className="flex items-center gap-2 px-1 text-[0.95rem]" style={{ color: "var(--ds-text-secondary)" }}>
          <IconCheck className="h-4 w-4" style={{ color: "var(--ds-success)" }} />
          After your Pause you {FEEDBACK_LABEL[highlight.feedback]}.
        </p>
      ) : null}

      {returnNote && returnNote.status !== "not-applicable" ? (
        <div className="ds-card ds-wash px-5 py-4">
          <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>The day after</p>
          {returnNote.responseText ? (
            <p className="mt-1.5 text-[0.98rem] italic leading-7">&ldquo;{returnNote.responseText}&rdquo;</p>
          ) : (
            <p className="mt-1.5 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              {returnNote.status === "dismissed" || returnNote.status === "expired" ? "You chose to let this one rest." : "Inner Pause will check in on this gently tomorrow."}
            </p>
          )}
        </div>
      ) : null}

      {otherEntries.length > 0 ? (
        <div className="space-y-2.5">
          <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>From your journal</p>
          {otherEntries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenEntry(entry)}
              className="journal-paper ds-tap block w-full rounded-[var(--ds-radius-md)] px-4 py-3 text-left text-[0.95rem] leading-6"
            >
              {entry.text.length > 110 ? `${entry.text.slice(0, 110)}…` : entry.text}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------ */
/* A Pause, as a stamp in the diary                  */
/* ------------------------------------------------ */

function PauseStamp({ pause }: { pause: PauseRecord }) {
  const [open, setOpen] = useState(false);
  const tone = pause.outcomeId && OUTCOME_LABEL[pause.outcomeId] ? `var(--ds-outcome-${pause.outcomeId})` : "var(--ds-accent)";
  const minutes = minutesLabel(listenedSeconds(pause));
  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic("tap");
          setOpen(true);
        }}
        aria-label={`${pauseName(pause)}, ${timeLabel(pause.completedAt ?? pause.startedAt)}`}
        className="pause-stamp ds-tap relative grid w-[4.6rem] justify-items-center gap-0.5 px-1.5 pb-2 pt-2.5"
        style={{ ["--stamp-tone" as string]: tone }}
      >
        <OutcomeEmblem id={pause.outcomeId} className="h-9 w-9" />
        <span className="text-[0.72rem] font-semibold leading-tight">{pause.outcomeId && OUTCOME_LABEL[pause.outcomeId] ? OUTCOME_LABEL[pause.outcomeId] : "Pause"}</span>
        <span className="ds-caption ds-num leading-tight">{minutes}</span>
        {pause.feedback === "better" ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--ds-success)" }} aria-hidden="true" /> : null}
      </button>
      {open ? <StampSheet pause={pause} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function StampSheet({ pause, onClose }: { pause: PauseRecord; onClose: () => void }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const when = new Date(pause.completedAt ?? pause.startedAt);

  useLayoutEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The same Pause again: its Home card if it came from one, otherwise a Ground Pause.
  const playAgain = () => {
    if (starting) return;
    setStarting(true);
    haptic("moment");
    const card = pause.outcomeId ? getVisibleCards().find((item) => item.id === pause.outcomeId) : undefined;
    const record = createPauseRecord(card ? composeCardPause(card) : composeGroundPause());
    router.push(`/pause/player?session=${record.id}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button type="button" aria-label="Close" onClick={onClose} className="sheet-backdrop absolute inset-0 cursor-default" style={{ background: "rgba(15, 23, 42, 0.35)" }} />
      <div role="dialog" aria-modal="true" aria-label={pauseName(pause)} className="sheet-panel relative w-full max-w-[30rem] rounded-t-[1.75rem] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3" style={{ background: "var(--ds-surface)", boxShadow: "var(--ds-shadow-raised)" }}>
        <span className="mx-auto mb-4 block h-1 w-10 rounded-full" style={{ background: "var(--ds-border)" }} aria-hidden="true" />
        <div className="flex items-center gap-4">
          <OutcomeEmblem id={pause.outcomeId} className="h-16 w-16 shrink-0" />
          <div className="min-w-0">
            <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
              {when.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · {timeLabel(when.toISOString())}
            </p>
            <h2 className="ds-h2 mt-0.5">{pauseName(pause)}</h2>
            {pause.feedback ? (
              <p className="mt-0.5 text-[0.9rem]" style={{ color: "var(--ds-text-secondary)" }}>
                Afterwards, you {FEEDBACK_LABEL[pause.feedback]}.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
          <button type="button" onClick={playAgain} disabled={starting} className="ds-filled">
            {starting ? "Starting" : "Play it again"}
          </button>
          <button type="button" onClick={onClose} className="ds-tap min-h-12 rounded-full px-4 text-sm font-semibold" style={{ color: "var(--ds-accent)" }}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

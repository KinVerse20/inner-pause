"use client";

import { useState } from "react";

import { LandscapeScene } from "@/components/landscape-scene";
import { IconCheck, IconPencil } from "@/components/pause-icons";
import { haptic } from "@/lib/haptics";
import type { Highlight } from "@/lib/journey-highlights";
import type { PauseRecord } from "@/lib/pause-storage";
import { createTellEntry, NOT_ROUTED_INTERPRETATION, type TellEntry } from "@/lib/tell-storage";

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

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function pauseName(pause: PauseRecord) {
  const minutes = Math.max(1, Math.round(pause.durationSeconds / 60));
  const outcome = pause.outcomeId ? OUTCOME_LABEL[pause.outcomeId] : null;
  const name = outcome ? `${outcome} Pause` : pause.title.replace(/\s+[—–-]\s+/g, " · ");
  return `${minutes} min ${name}`;
}

/* ------------------------------------------------------------------ */
/* Summary — the month in one human sentence, plus this week's rhythm */
/* ------------------------------------------------------------------ */

export function JourneySummary({ pauses, entries, moments }: { pauses: PauseRecord[]; entries: TellEntry[]; moments: number }) {
  // Captured once per mount, so the summary is stable across re-renders.
  const [monthAgo] = useState(() => Date.now() - 30 * 86_400_000);
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

  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = dayKey(day.toISOString());
    return {
      key,
      initial: day.toLocaleDateString(undefined, { weekday: "narrow" }),
      paused: pauses.some((pause) => pause.completedAt && dayKey(pause.completedAt) === key),
      today: index === 6,
    };
  });

  return (
    <section aria-label="Your month" className="ds-card overflow-hidden px-5 py-5">
      <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
        This month
      </p>
      <p className="mt-2 text-[1.1rem] font-semibold leading-7">{sentence}</p>
      {best ? (
        <p className="mt-1 text-[0.92rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
          <span style={{ color: `var(--ds-outcome-${best})` }}>{OUTCOME_LABEL[best]}</span> has helped you most.
        </p>
      ) : null}
      <div className="mt-4 flex items-end justify-between gap-3">
        <ol className="flex gap-2" aria-label="This week">
          {week.map((day) => (
            <li key={day.key} className="grid justify-items-center gap-1">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: day.paused ? "var(--ds-accent-secondary)" : "transparent",
                  border: day.paused ? "none" : "1.5px solid var(--ds-border)",
                }}
                aria-label={day.paused ? "Paused" : "No Pause"}
              />
              <span className="ds-caption" style={day.today ? { color: "var(--ds-text)" } : undefined}>
                {day.initial}
              </span>
            </li>
          ))}
        </ol>
        <p className="ds-caption ds-num text-right">
          {moments} {moments === 1 ? "moment" : "moments"}
        </p>
      </div>
    </section>
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
  onOpenEntry,
  onOpenHighlight,
}: {
  items: StoryItem[];
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
            {group.items.map((item) => {
              if (item.kind === "entry") {
                return (
                  <li key={`e-${item.entry.id}`} className="story-node">
                    <EntryCard item={item} onOpen={() => onOpenEntry(item.entry)} />
                  </li>
                );
              }
              if (item.kind === "moment") {
                const tilt = polaroidIndex++ % 2 === 0 ? -0.8 : 0.7;
                return (
                  <li key={`m-${item.highlight.id}`} className="story-node">
                    <PolaroidCard highlight={item.highlight} tilt={tilt} onOpen={() => onOpenHighlight(item.highlight)} />
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
              return (
                <li key={`x-${item.pause.id}`} className="story-node story-node--small">
                  <p className="py-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                    <span style={{ color: "var(--ds-text)" }}>{pauseName(item.pause)}</span>
                    {item.pause.feedback ? ` · ${FEEDBACK_LABEL[item.pause.feedback]}` : ""}
                    <span className="ds-caption"> · {timeLabel(item.at)}</span>
                  </p>
                </li>
              );
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
  return (
    <button type="button" onClick={onOpen} className="journal-paper ds-tap relative block w-full rounded-[var(--ds-radius-lg)] px-5 pb-4 pt-8 text-left">
      <span className="journal-tape" aria-hidden="true" />
      <svg viewBox="0 0 24 18" className="absolute left-4 top-3 h-4 w-5" style={{ color: "var(--ds-accent-secondary)", opacity: 0.45 }} aria-hidden="true">
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
        <span className="block text-[1.02rem] font-semibold leading-6">{highlight.title}</span>
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

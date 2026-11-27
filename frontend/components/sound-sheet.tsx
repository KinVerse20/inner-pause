"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconCheck, IconChevronDown, IconVolumeOff, IconVolumeOn } from "@/components/pause-icons";
import { BUILT_IN_SOUNDS, UNDERTONE_LEVELS, findBuiltInSound, soundFits, type BuiltInSoundId, type UndertoneLevel } from "@/lib/sound-library";

// The player's Sound sheet. Two plain questions, nothing to learn:
//   What you hear: six sounds as tiles, the rest under More.
//   Tone: how present this Pause's frequency is, Off to Clear. For the
//   sounds that are the frequency itself (Frequency only, Binaural): how
//   loud, Soft to Clear.
// Every tap changes what's playing right away, so you choose by ear.
// A bottom sheet on the player's navy (dismiss: outside, Done, Escape).

export type ToneSetting = "off" | UndertoneLevel;

const MAIN: BuiltInSoundId[] = ["rain", "rainforest", "waves", "wind", "deep-ambient", "binaural-focus"];
const SHORT_NAME: Partial<Record<BuiltInSoundId, string>> = { waves: "Ocean", wind: "Wind" };

const TONE_STOPS: Array<{ id: ToneSetting; label: string; bars: number }> = [
  { id: "off", label: "Off", bars: 0 },
  ...UNDERTONE_LEVELS.map((level, index) => ({ id: level.id, label: level.label, bars: index + 1 })),
];

export function SoundSheet({
  currentId,
  tone,
  level,
  frequencyHz,
  frequencyLabel,
  muted,
  onChoose,
  onTone,
  onToggleMute,
  onClose,
  severalFrequencies = false,
}: {
  currentId: BuiltInSoundId;
  tone: ToneSetting;
  /** Soft, Balanced or Clear: kept even with the tone off. */
  level: UndertoneLevel;
  /** This Pause's frequency now: a tuned recording shows only when one exists at exactly it. */
  frequencyHz: number | null;
  frequencyLabel: string | null;
  muted: boolean;
  onChoose: (id: BuiltInSoundId) => void;
  onTone: (tone: ToneSetting) => void;
  /** Absent before the Pause has started: nothing to mute yet. */
  onToggleMute?: () => void;
  onClose: () => void;
  /** A Pause with several centres: the tuned recordings (one frequency each) aren't offered. */
  severalFrequencies?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const current = findBuiltInSound(currentId);
  // Opens on More when the current sound lives there.
  const [moreOpen, setMoreOpen] = useState(!MAIN.includes(currentId));
  const premixed = Boolean(current?.tunedFile);
  const generated = Boolean(current?.generated);
  const fits = (id: BuiltInSoundId) => {
    const sound = findBuiltInSound(id);
    return Boolean(sound) && soundFits(sound!, frequencyHz, severalFrequencies);
  };
  const main = MAIN.filter(fits);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("[aria-checked='true']")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const more = BUILT_IN_SOUNDS.filter((sound) => !MAIN.includes(sound.id) && fits(sound.id));
  // Frequency only and Binaural are the frequency: no Off, just how loud.
  const stops = generated ? TONE_STOPS.filter((stop) => stop.id !== "off") : TONE_STOPS;
  const selectedStop: ToneSetting = generated ? level : tone;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button type="button" aria-label="Close sound" onClick={onClose} className="sheet-backdrop absolute inset-0 cursor-default" style={{ background: "rgba(8, 7, 28, 0.55)" }} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sound-sheet-title"
        className="sheet-panel relative max-h-[88dvh] w-full max-w-[30rem] overflow-y-auto rounded-t-[1.75rem] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3"
        style={{ background: "#262357", color: "var(--ds-on-navy)", boxShadow: "0 -12px 40px rgba(0,0,0,0.35)" }}
      >
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full" style={{ background: "rgba(248,250,252,0.25)" }} aria-hidden="true" />
        <div className="flex items-center gap-1">
          <h2 id="sound-sheet-title" className="ds-h2 flex-1">
            Sound
          </h2>
          {onToggleMute ? (
          <button
            type="button"
            role="switch"
            aria-checked={muted}
            aria-label={muted ? "Sound is muted. Turn it on" : "Mute"}
            onClick={onToggleMute}
            className="ds-tap grid h-11 w-11 place-items-center rounded-full"
            style={{ background: muted ? "rgba(196,181,253,0.2)" : "transparent", color: muted ? "#C4B5FD" : "var(--ds-on-navy-muted)" }}
          >
            {muted ? <IconVolumeOff className="h-5 w-5" /> : <IconVolumeOn className="h-5 w-5" />}
          </button>
          ) : null}
          <button type="button" onClick={onClose} className="ds-tap min-h-11 rounded-full px-3 text-sm font-semibold" style={{ color: "#C4B5FD" }}>
            Done
          </button>
        </div>

        <p id="hear-label" className="ds-label mt-3 uppercase" style={{ color: "var(--ds-on-navy-muted)" }}>
          What you hear
        </p>
        <div role="radiogroup" aria-labelledby="hear-label" className="mt-2 grid grid-cols-3 gap-2">
          {main.map((id) => {
            const sound = findBuiltInSound(id);
            if (!sound) return null;
            const selected = id === currentId;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChoose(id)}
                className="ds-tap relative grid justify-items-center gap-1.5 rounded-[var(--ds-radius-md)] px-1 pb-2.5 pt-3"
                style={{
                  background: selected ? "rgba(196,181,253,0.18)" : "rgba(248,250,252,0.05)",
                  boxShadow: selected ? "inset 0 0 0 1.5px #C4B5FD" : "inset 0 0 0 1px rgba(248,250,252,0.06)",
                }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: selected ? "#C4B5FD" : "rgba(248,250,252,0.08)", color: selected ? "#1D1B4C" : "#DDD6FE" }} aria-hidden="true">
                  <SoundGlyph id={id} />
                </span>
                <span className="text-[0.85rem] font-medium">{SHORT_NAME[id] ?? sound.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="more-sounds"
          onClick={() => setMoreOpen((value) => !value)}
          className="ds-tap mt-2 flex min-h-11 w-full items-center justify-center gap-1 rounded-full text-sm font-medium"
          style={{ color: "var(--ds-on-navy-muted)" }}
        >
          {moreOpen ? "Fewer sounds" : "More sounds"}
          <IconChevronDown className="h-4 w-4 transition-transform" style={{ transform: moreOpen ? "rotate(180deg)" : undefined }} />
        </button>

        {moreOpen ? (
          <div id="more-sounds" role="radiogroup" aria-label="More sounds" className="ds-settle mb-1 flex flex-wrap gap-2">
            {more.map((sound) => {
              const selected = sound.id === currentId;
              return (
                <button
                  key={sound.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChoose(sound.id)}
                  className="ds-tap inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[0.85rem] font-medium"
                  style={{
                    background: selected ? "#C4B5FD" : "rgba(248,250,252,0.07)",
                    color: selected ? "#1D1B4C" : "var(--ds-on-navy)",
                  }}
                >
                  {selected ? <IconCheck className="h-3.5 w-3.5" /> : null}
                  {sound.label}
                  {sound.headphoneOnly ? <HeadphonesMark /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(248,250,252,0.08)" }}>
          <div className="flex items-baseline justify-between">
            <p id="tone-label" className="ds-label uppercase" style={{ color: "var(--ds-on-navy-muted)" }}>
              Tone
            </p>
            {frequencyLabel ? (
              <span className="ds-caption ds-num" style={{ color: "var(--ds-on-navy-muted)" }}>
                {frequencyLabel}
              </span>
            ) : null}
          </div>
          {premixed ? (
            <p className="mt-2 text-[0.85rem] leading-5" style={{ color: "var(--ds-on-navy-muted)" }}>
              This recording already carries the tone.
            </p>
          ) : (
            <>
              <div
                role="radiogroup"
                aria-labelledby="tone-label"
                className={`mt-2 grid ${stops.length === 3 ? "grid-cols-3" : "grid-cols-4"} gap-1 rounded-[var(--ds-radius-md)] p-1`}
                style={{ background: "rgba(248,250,252,0.06)" }}
              >
                {stops.map((stop) => {
                  const selected = stop.id === selectedStop;
                  return (
                    <button
                      key={stop.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onTone(stop.id)}
                      className="ds-tap grid min-h-[3.4rem] justify-items-center gap-1 rounded-[calc(var(--ds-radius-md)-4px)] pb-1.5 pt-2 text-[0.8rem] font-semibold"
                      style={{ background: selected ? "var(--ds-on-navy)" : "transparent", color: selected ? "var(--ds-navy)" : "var(--ds-on-navy)" }}
                    >
                      <ToneBars level={stop.bars} />
                      {stop.label}
                    </button>
                  );
                })}
              </div>
              <p className="ds-caption mt-2" style={{ color: "var(--ds-on-navy-muted)" }}>
                {generated
                  ? currentId === "binaural-focus"
                    ? "The frequency in your left ear, a few hertz above it in your right. Use headphones."
                    : "The frequency on its own."
                  : tone === "off"
                    ? "Just the sound you chose."
                    : "A quiet hum beneath the sound."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ToneBars({ level }: { level: number }) {
  return (
    <span className="flex h-3.5 items-end gap-[3px]" aria-hidden="true">
      {[0.45, 0.7, 1].map((height, index) => (
        <span key={index} className="w-[3px] rounded-full" style={{ height: `${height * 100}%`, background: "currentColor", opacity: index < level ? 1 : 0.25 }} />
      ))}
    </span>
  );
}

function HeadphonesMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-label="best with headphones" role="img">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3.5" y="14" width="4" height="6" rx="1.5" />
      <rect x="16.5" y="14" width="4" height="6" rx="1.5" />
    </svg>
  );
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.35rem] w-[1.35rem]" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function SoundGlyph({ id }: { id: BuiltInSoundId }) {
  switch (id) {
    case "rain":
      return (
        <Glyph>
          <path d="M7 14.5a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17.3 7.3 3.6 3.6 0 0 1 17 14.5H7Z" />
          <path d="M8.5 17.5 7.8 19.3M12.3 17.5l-.7 1.8M16 17.5l-.7 1.8" />
        </Glyph>
      );
    case "rainforest":
      return (
        <Glyph>
          <path d="M12 3.5 6.5 11h3L6 16h12l-3.5-5h3L12 3.5Z" />
          <path d="M12 16v4.5" />
        </Glyph>
      );
    case "waves":
      return (
        <Glyph>
          <path d="M3 9.5c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5" />
          <path d="M3 14.5c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5" />
        </Glyph>
      );
    case "wind":
      return (
        <Glyph>
          <path d="M3.5 9h10a2.5 2.5 0 1 0-2.5-2.5" />
          <path d="M3.5 13h14a2.5 2.5 0 1 1-2.5 2.5" />
          <path d="M3.5 17h6" />
        </Glyph>
      );
    case "deep-ambient":
      return (
        <Glyph>
          <circle cx="12" cy="12" r="2.2" />
          <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
          <path d="M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" />
        </Glyph>
      );
    case "binaural-focus":
      return (
        <Glyph>
          <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
          <rect x="3.5" y="14" width="4" height="6" rx="1.5" />
          <rect x="16.5" y="14" width="4" height="6" rx="1.5" />
        </Glyph>
      );
    default:
      return null;
  }
}

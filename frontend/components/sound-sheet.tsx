"use client";

import { useEffect, useRef } from "react";

import { IconCheck } from "@/components/pause-icons";
import { BUILT_IN_SOUNDS, UNDERTONE_LEVELS, type BuiltInSoundId, type UndertoneLevel } from "@/lib/sound-library";

// The player's Sound sheet: change the sound live, set how present the
// frequency undertone is, or mute. A bottom sheet (thumb reach, one layer,
// dismiss by tapping outside, Done or Escape), on the player's navy.
export function SoundSheet({
  currentId,
  undertone,
  muted,
  onChoose,
  onUndertone,
  onToggleMute,
  onClose,
}: {
  currentId: BuiltInSoundId;
  undertone: UndertoneLevel;
  muted: boolean;
  onChoose: (id: BuiltInSoundId) => void;
  onUndertone: (level: UndertoneLevel) => void;
  onToggleMute: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
      <button
        type="button"
        aria-label="Close sound settings"
        onClick={onClose}
        className="sheet-backdrop absolute inset-0 cursor-default"
        style={{ background: "rgba(8, 7, 28, 0.55)" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sound-sheet-title"
        className="sheet-panel relative max-h-[85dvh] w-full max-w-[30rem] overflow-y-auto rounded-t-[1.75rem] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3"
        style={{ background: "#262357", color: "var(--ds-on-navy)", boxShadow: "0 -12px 40px rgba(0,0,0,0.35)" }}
      >
        <span className="mx-auto mb-4 block h-1 w-10 rounded-full" style={{ background: "rgba(248,250,252,0.25)" }} aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h2 id="sound-sheet-title" className="ds-h2">
            Sound
          </h2>
          <button type="button" onClick={onClose} className="ds-tap min-h-11 rounded-full px-4 text-sm font-semibold" style={{ color: "#C4B5FD" }}>
            Done
          </button>
        </div>

        <div role="radiogroup" aria-label="Sound" className="mt-3 grid gap-1">
          {BUILT_IN_SOUNDS.map((sound) => {
            const selected = sound.id === currentId;
            return (
              <button
                key={sound.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChoose(sound.id)}
                className="ds-tap flex min-h-[3.5rem] items-center gap-3 rounded-[var(--ds-radius-md)] px-3 py-2.5 text-left"
                style={{ background: selected ? "rgba(196,181,253,0.16)" : "transparent" }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.95rem] font-medium">{sound.label}</span>
                  <span className="block text-[0.8rem] leading-5" style={{ color: "var(--ds-on-navy-muted)" }}>
                    {sound.copy}
                    {sound.headphoneOnly ? " · headphones" : ""}
                  </span>
                </span>
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                  style={{ background: selected ? "#C4B5FD" : "transparent", border: selected ? "none" : "1.5px solid rgba(248,250,252,0.3)", color: "#1D1B4C" }}
                  aria-hidden="true"
                >
                  {selected ? <IconCheck className="h-3.5 w-3.5" /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <p id="undertone-label" className="ds-label uppercase" style={{ color: "var(--ds-on-navy-muted)" }}>
            Frequency undertone
          </p>
          <div role="radiogroup" aria-labelledby="undertone-label" className="mt-2 grid grid-cols-3 gap-1 rounded-full p-1" style={{ background: "rgba(248,250,252,0.08)" }}>
            {UNDERTONE_LEVELS.map((level) => {
              const selected = level.id === undertone;
              return (
                <button
                  key={level.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onUndertone(level.id)}
                  className="ds-tap min-h-11 rounded-full text-sm font-semibold"
                  style={{ background: selected ? "var(--ds-on-navy)" : "transparent", color: selected ? "var(--ds-navy)" : "var(--ds-on-navy)" }}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
          <p className="ds-caption mt-2" style={{ color: "var(--ds-on-navy-muted)" }}>
            Balanced is a good place to start.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={muted}
          onClick={onToggleMute}
          className="ds-tap mt-5 flex min-h-12 w-full items-center justify-between rounded-[var(--ds-radius-md)] px-3"
          style={{ background: "rgba(248,250,252,0.06)" }}
        >
          <span className="text-[0.95rem] font-medium">Mute</span>
          <span
            className="relative h-7 w-12 rounded-full transition-colors duration-[var(--ds-duration-base)]"
            style={{ background: muted ? "#C4B5FD" : "rgba(248,250,252,0.2)" }}
            aria-hidden="true"
          >
            <span
              className="absolute top-1 h-5 w-5 rounded-full transition-[left] duration-[var(--ds-duration-base)]"
              style={{ left: muted ? "1.5rem" : "0.25rem", background: "var(--ds-on-navy)" }}
            />
          </span>
        </button>
      </div>
    </div>
  );
}

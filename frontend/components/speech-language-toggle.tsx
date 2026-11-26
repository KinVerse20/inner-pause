"use client";

import { haptic } from "@/lib/haptics";
import type { SpeechLanguage } from "@/lib/preferences-store";

// English · Hindi, by the mic. Hindi is heard as Hindi and shown in
// English letters ("aap kya kar rahe ho"), on the phone. Remembered.
const OPTIONS: Array<{ id: SpeechLanguage; label: string }> = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
];

export function SpeechLanguageToggle({
  language,
  onChange,
  dark = false,
}: {
  language: SpeechLanguage;
  onChange: (language: SpeechLanguage) => void;
  /** On the player's navy. */
  dark?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Language you speak in"
      className="inline-grid grid-cols-2 gap-1 rounded-full p-1"
      style={{ background: dark ? "rgba(248,250,252,0.08)" : "var(--ds-accent-soft)" }}
    >
      {OPTIONS.map((option) => {
        const on = option.id === language;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              if (on) return;
              haptic("tap");
              onChange(option.id);
            }}
            className="ds-tap min-h-9 rounded-full px-4 text-[0.85rem] font-semibold"
            style={
              on
                ? dark
                  ? { background: "var(--ds-on-navy)", color: "var(--ds-navy)" }
                  : { background: "var(--ds-surface)", color: "var(--ds-accent)", boxShadow: "var(--ds-elevation-1)" }
                : { color: dark ? "var(--ds-on-navy-muted)" : "var(--ds-text-secondary)" }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

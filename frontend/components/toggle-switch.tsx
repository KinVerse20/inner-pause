"use client";

// Shared accessible toggle for You's settings screens (Notifications
// categories, sound/offline preferences, privacy consent) — a real
// role="switch" control, not a styled checkbox hidden behind a label. The
// invisible ::after extends its touch area to 44×64 px around the 28×48 track.
export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="ds-tap relative h-7 w-12 shrink-0 rounded-full after:absolute after:-inset-2 after:content-[''] disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ds-accent)]"
      style={{ background: checked ? "var(--ds-accent)" : "var(--ds-border)" }}
    >
      {/* left-0 anchors the knob: a button centres its content, so without
          it the knob starts mid-track and slides out past the end. On, it
          takes the accent's own text colour, which contrasts in both themes. */}
      <span
        className="absolute left-0 top-0.5 h-6 w-6 rounded-full shadow transition-[transform,background-color]"
        style={{
          transform: checked ? "translateX(1.375rem)" : "translateX(0.125rem)",
          background: checked ? "var(--ds-accent-on)" : "#ffffff",
        }}
      />
    </button>
  );
}

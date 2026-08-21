// The Harmony Form as a live, animated playback visual — built from the
// exact locked geometry in docs/BRAND_IDENTITY.md §6.1 (same coordinates
// and colors as public/branding/innerpause-mark.svg / -mark-dark.svg), not
// approximated, so it can be driven by real CSS animation instead of a
// static <img>. This replaces the old WaveformFace visual for the Pause
// Player (docs/DESIGN_SYSTEM.md §8 — one core visual form, not a
// music-player clone).
"use client";

const RINGS_LIGHT = [
  { cx: 106, cy: 112, r: 86, stroke: "#C4B5FD", opacity: 0.55 },
  { cx: 134, cy: 110, r: 84, stroke: "#7C6AED", opacity: 0.7 },
  { cx: 112, cy: 134, r: 82, stroke: "#4338CA", opacity: 0.85 },
  { cx: 128, cy: 128, r: 80, stroke: "#1D1B4C", opacity: 0.95 },
];

const RINGS_DARK = [
  { cx: 106, cy: 112, r: 86, stroke: "#4338CA", opacity: 0.5 },
  { cx: 134, cy: 110, r: 84, stroke: "#7C6AED", opacity: 0.65 },
  { cx: 112, cy: 134, r: 82, stroke: "#C4B5FD", opacity: 0.8 },
  { cx: 128, cy: 128, r: 80, stroke: "#F8FAFC", opacity: 0.95 },
];

const CENTER = 120;
const PROGRESS_RADIUS = 104;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export function HarmonyFormVisual({
  playing,
  progress = 0,
  dark = false,
  className = "",
}: {
  /** Whether a Pause is actively playing — used only for a subtle liveliness shift, never a literal audio visualizer. */
  playing: boolean;
  /** 0–1 completion fraction, folded into the same form rather than a separate progress bar (docs/DESIGN_SYSTEM.md §8). */
  progress?: number;
  dark?: boolean;
  className?: string;
}) {
  const rings = dark ? RINGS_DARK : RINGS_LIGHT;
  const barFill = dark ? "#F8FAFC" : "#1D1B4C";
  const progressColor = dark ? "#C4B5FD" : "#7C6AED";
  const clamped = Math.min(1, Math.max(0, progress));
  const dashOffset = PROGRESS_CIRCUMFERENCE * (1 - clamped);

  return (
    <svg
      viewBox="0 0 240 240"
      className={`harmony-form ${playing ? "harmony-form--playing" : ""} ${className}`}
      role="img"
      aria-hidden="true"
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={PROGRESS_RADIUS}
        stroke={progressColor}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        style={{
          strokeDasharray: PROGRESS_CIRCUMFERENCE,
          strokeDashoffset: dashOffset,
          transition: "stroke-dashoffset 1s linear",
        }}
      />
      {rings.map((ring, index) => (
        <circle
          key={index}
          cx={ring.cx}
          cy={ring.cy}
          r={ring.r}
          stroke={ring.stroke}
          strokeWidth={3 + index * 0.5}
          opacity={ring.opacity}
          fill="none"
          className={`harmony-form-ring harmony-form-ring--${index}`}
        />
      ))}
      <rect x={94} y={82} width={18} height={76} rx={9} fill={barFill} />
      <rect x={128} y={82} width={18} height={76} rx={9} fill={barFill} />
    </svg>
  );
}

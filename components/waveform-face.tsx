"use client";

// The session's emotional-journey visual (docs/PRODUCT_ROADMAP.md #5):
// a waveform whose bars read as an equalizer and whose two tallest bars sit
// where "eyes" would be; a curved "mouth" beneath shifts from concave
// (tense) to convex (calm) as `progress` moves from 0 to 1. Progress-driven
// rather than reactive to actual audio amplitude — a loud drum hit doesn't
// mean "more tense," but session progress reliably tells the calm-down
// story regardless of what's playing.
const BAR_COUNT = 11;
const EYE_INDICES = [3, 7];

export function WaveformFace({
  progress,
  color,
  accent,
  className = "",
}: {
  progress: number;
  color: string;
  accent: string;
  className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const baselineY = 78;
  // Starts below baseline (frown/tense) and ends above it (smile/calm).
  const controlY = baselineY + 20 - clamped * 40;
  const mouthPath = `M 56 ${baselineY} Q 100 ${controlY} 144 ${baselineY}`;

  return (
    <div className={`relative grid aspect-square place-items-center ${className}`}>
      <div
        className="ip-blob-shape ip-blob-float absolute inset-0"
        style={{ background: `radial-gradient(circle at 40% 35%, ${accent}, ${color}55)` }}
      />
      <svg viewBox="0 0 200 130" className="relative z-10 h-[64%] w-[64%]" style={{ color }}>
        {Array.from({ length: BAR_COUNT }).map((_, index) => {
          const x = 18 + index * 15;
          const isEye = EYE_INDICES.includes(index);
          const baseHeight = isEye ? 32 : 12 + (index % 3) * 5;
          return (
            <rect
              key={index}
              className="wf-bar"
              x={x}
              y={38 - baseHeight / 2}
              width={isEye ? 9 : 5}
              height={baseHeight}
              rx={isEye ? 4.5 : 2.5}
              fill="currentColor"
              opacity={isEye ? 1 : 0.5}
              style={{ animationDelay: `${index * 0.11}s` }}
            />
          );
        })}
        <path d={mouthPath} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
      </svg>
    </div>
  );
}

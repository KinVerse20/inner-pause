"use client";

import { ChakraId, RelaxMoodId } from "@/lib/types";

const baseProps = (className?: string, strokeWidth = 1.8) => ({
  className,
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function MoodLineIcon({
  moodId,
  className = "h-8 w-8",
}: {
  moodId: RelaxMoodId;
  className?: string;
}) {
  if (moodId === "calm") {
    return (
      <svg {...baseProps(className)}>
        <path d="M10 26c8-7 16-7 24 0s16 7 24 0" />
        <path d="M10 38c8-7 16-7 24 0s16 7 24 0" />
      </svg>
    );
  }

  if (moodId === "sleep") {
    return (
      <svg {...baseProps(className)}>
        <path d="M42 10a21 21 0 1 0 12 36 24 24 0 0 1-12-36Z" />
        <path d="M47 20h5M49.5 17.5v5M37 13h3M38.5 11.5v3" />
      </svg>
    );
  }

  if (moodId === "focus") {
    return (
      <svg {...baseProps(className)}>
        <circle cx="32" cy="32" r="9" />
        <path d="M32 8v10M32 46v10M8 32h10M46 32h10" />
        <circle cx="32" cy="32" r="22" />
      </svg>
    );
  }

  if (moodId === "grounded") {
    return (
      <svg {...baseProps(className)}>
        <path d="M16 42c21-1 32-12 34-30-18 1-31 10-34 30Z" />
        <path d="M21 39c8-9 16-15 25-21M29 31l11 2M28 31l-1-11" />
      </svg>
    );
  }

  if (moodId === "positive") {
    return (
      <svg {...baseProps(className)}>
        <circle cx="32" cy="32" r="11" />
        <path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6" />
      </svg>
    );
  }

  if (moodId === "emotionally-lighter") {
    return (
      <svg {...baseProps(className)}>
        <path d="M32 52S12 40 12 24c0-8 6-14 14-14 4 0 7 2 10 5 3-3 6-5 10-5 8 0 14 6 14 14 0 16-20 28-28 28Z" />
      </svg>
    );
  }

  if (moodId === "confidence") {
    return (
      <svg {...baseProps(className)}>
        <path d="M32 8l7 17 17 7-17 7-7 17-7-17-17-7 17-7 7-17Z" />
      </svg>
    );
  }

  return (
    <svg {...baseProps(className)}>
      <path d="M22 20c-6 4-8 9-8 12s2 8 8 12M42 20c6 4 8 9 8 12s-2 8-8 12" />
      <circle cx="32" cy="32" r="5" />
      <path d="M22 32h-3M45 32h-3" />
    </svg>
  );
}

export function ChakraGlyph({
  chakraId,
  className = "h-10 w-10",
}: {
  chakraId: ChakraId;
  className?: string;
}) {
  const sides: Record<ChakraId, number> = {
    root: 4,
    sacral: 8,
    "solar-plexus": 10,
    heart: 12,
    throat: 16,
    "third-eye": 2,
    crown: 18,
  };

  return (
    <svg {...baseProps(className, 1.5)}>
      <circle cx="32" cy="32" r="19" />
      {Array.from({ length: sides[chakraId] }).map((_, index) => (
        <path
          key={`${chakraId}-${index}`}
          d="M32 8c5 7 5 13 0 18-5-5-5-11 0-18Z"
          transform={`rotate(${(360 / sides[chakraId]) * index} 32 32)`}
        />
      ))}
      {chakraId === "root" ? <path d="M20 23h24L32 44 20 23Z" /> : null}
      {chakraId === "sacral" ? <circle cx="32" cy="32" r="10" /> : null}
      {chakraId === "solar-plexus" ? <path d="M20 42h24L32 21 20 42Z" /> : null}
      {chakraId === "heart" ? (
        <>
          <path d="M20 25h24L32 46 20 25Z" />
          <path d="M20 39h24L32 18 20 39Z" />
        </>
      ) : null}
      {chakraId === "throat" ? <circle cx="32" cy="32" r="8" /> : null}
      {chakraId === "third-eye" ? (
        <>
          <path d="M12 32s8-12 20-12 20 12 20 12-8 12-20 12-20-12-20-12Z" />
          <circle cx="32" cy="32" r="5" />
        </>
      ) : null}
      {chakraId === "crown" ? <circle cx="32" cy="32" r="7" /> : null}
    </svg>
  );
}

export function NavIcon({ label, className = "h-6 w-6" }: { label: string; className?: string }) {
  if (label === "Relax") {
    return (
      <svg {...baseProps(className)}>
        <path d="M32 14c6 8 10 15 10 23a10 10 0 0 1-20 0c0-8 4-15 10-23Z" />
        <path d="M20 46h24M24 54h16" />
      </svg>
    );
  }
  if (label === "Chakras") return <ChakraGlyph chakraId="crown" className={className} />;
  if (label === "Journey") {
    return (
      <svg {...baseProps(className)}>
        <path d="M14 42c10-18 26 4 36-14" />
        <path d="M44 16l4 4 4-4M19 48l-4-4-4 4" />
      </svg>
    );
  }
  return (
    <svg {...baseProps(className)}>
      <path d="M32 12a20 20 0 1 1-18 29" />
      <path d="M14 41H8v-6M32 22v12l9 5" />
    </svg>
  );
}

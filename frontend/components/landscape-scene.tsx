"use client";

import { useId } from "react";

type LandscapeVariant = "day" | "dawn" | "dusk" | "complete";

const PALETTE: Record<
  LandscapeVariant,
  { sky: [string, string]; far: string; mid: string; near: string; water: [string, string]; orb: string; tree: string }
> = {
  day: {
    sky: ["#F7EFE4", "#E8D7C2"],
    far: "#D4C4B0",
    mid: "#B7C4A6",
    near: "#8FA086",
    water: ["#D5E5EC", "#B9CDD6"],
    orb: "#F0C49A",
    tree: "#5E7358",
  },
  dawn: {
    sky: ["#FBE6D0", "#F3C7A0"],
    far: "#E2B48C",
    mid: "#D9B089",
    near: "#C49672",
    water: ["#E8D4C4", "#D4B8A4"],
    orb: "#F4B27A",
    tree: "#8A6A4E",
  },
  dusk: {
    sky: ["#D8D0EA", "#9A8FC4"],
    far: "#6B6490",
    mid: "#4F4A72",
    near: "#3A3658",
    water: ["#C9C4DC", "#A8A0C4"],
    orb: "#F4F0E6",
    tree: "#2E2A48",
  },
  complete: {
    sky: ["#F6EFE4", "#EEDDC8"],
    far: "#D4C4B0",
    mid: "#B7C4A6",
    near: "#8FA086",
    water: ["#D5E5EC", "#B9CDD6"],
    orb: "#F0C49A",
    tree: "#5E7358",
  },
};

export function LandscapeScene({
  variant = "day",
  className = "",
}: {
  variant?: LandscapeVariant;
  className?: string;
}) {
  const palette = PALETTE[variant];
  const night = variant === "dusk";
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 360 240"
      preserveAspectRatio="xMidYMid slice"
      className={`landscape-scene ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </linearGradient>
        <linearGradient id={`water-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.water[0]} />
          <stop offset="100%" stopColor={palette.water[1]} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.orb} stopOpacity="0.55" />
          <stop offset="100%" stopColor={palette.orb} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="360" height="240" fill={`url(#sky-${uid})`} />

      <g className="landscape-orb">
        <circle cx="180" cy={night ? 54 : 68} r="42" fill={`url(#glow-${uid})`} />
        <circle cx="180" cy={night ? 54 : 68} r="16" fill={palette.orb} />
      </g>

      <g className="landscape-hills">
        <path d="M0 120 C48 108 86 128 128 118 C176 106 214 124 262 114 C310 104 338 118 360 112 V240 H0 Z" fill={palette.far} />
        <path d="M0 148 C58 132 102 162 158 146 C214 130 258 156 312 142 C340 136 352 148 360 144 V240 H0 Z" fill={palette.mid} />
        <path d="M0 176 C70 162 118 186 176 170 C232 154 276 180 360 168 V240 H0 Z" fill={palette.near} />
      </g>

      <g className="landscape-water">
        <path
          d="M196 248 C118 214 248 176 152 138 C78 108 236 78 180 42"
          fill="none"
          stroke={`url(#water-${uid})`}
          strokeWidth="36"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M196 248 C118 214 248 176 152 138 C78 108 236 78 180 42"
          fill="none"
          stroke={night ? "#EDE8F6" : "#F4F8FA"}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.35"
        />
      </g>

      <g className="landscape-trees">
        <ellipse cx="64" cy="186" rx="16" ry="5" fill={palette.tree} opacity="0.3" />
        <path d="M64 188 C56 164 50 148 64 134 C78 148 72 164 64 188 Z" fill={palette.tree} />
        <ellipse cx="292" cy="190" rx="14" ry="4.5" fill={palette.tree} opacity="0.3" />
        <path d="M292 192 C286 172 278 158 292 146 C306 158 298 172 292 192 Z" fill={palette.tree} />
      </g>
    </svg>
  );
}

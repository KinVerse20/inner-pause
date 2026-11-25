"use client";

import { useId } from "react";

import type { BigMomentMode } from "@/lib/big-moment-engine";

// The three Moments as small lit scenes, drawn like Home's feeling emblems
// (components/outcome-emblem.tsx) so the two tabs read as one family.
//   Coming up:     a road leading to a sun rising ahead.
//   Happening now: rain, with the sun breaking through the cloud.
//   Just happened: the sun setting, its light on the water.

export function MomentEmblem({ mode, tone, className = "" }: { mode: BigMomentMode; tone: string; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const color = `var(--ds-outcome-${tone})`;
  const light = `color-mix(in srgb, ${color} 35%, white)`;
  const deep = `color-mix(in srgb, ${color} 80%, #1d1b4c)`;
  const fill = `url(#m-fill-${uid})`;
  const deepFill = `url(#m-deep-${uid})`;

  let art: React.ReactNode;
  if (mode === "before") {
    art = (
      <>
        <path d="M24 9.5v3M15.5 13l2 2M32.5 13l-2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M17 22a7 7 0 0 1 14 0Z" fill={fill} />
        <path d="M8 22.5h32" stroke={deep} strokeWidth="2" strokeLinecap="round" />
        <path d="M22.6 24 13 39h22l-9.6-15Z" fill={deepFill} />
        <path d="M24 27.5v2.2M24 33v3.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      </>
    );
  } else if (mode === "during") {
    art = (
      <>
        <circle cx="30.5" cy="16" r="6.5" fill={light} />
        <path d="M30.5 6.5v2M38.5 9.5l-1.4 1.4M41 17h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
        <path d="M14 30.5a6 6 0 0 1 .9-11.9A8.5 8.5 0 0 1 31 20.5a5 5 0 0 1 .5 10Z" fill={fill} />
        <path d="M17.5 34.5 16 38.5M23.5 34.5 22 38.5M29.5 34.5 28 38.5" stroke={deep} strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      </>
    );
  } else {
    art = (
      <>
        <path d="M13 12.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7Z" fill={light} />
        <path d="M15 27a9 9 0 0 1 18 0Z" fill={fill} />
        <path d="M8 27.5h32" stroke={deep} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M16.5 32h15" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        <path d="M19.5 36h9" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        <path d="M22.5 40h3" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
      </>
    );
  }

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`m-halo-${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id={`m-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: light }} />
          <stop offset="100%" style={{ stopColor: color }} />
        </linearGradient>
        <linearGradient id={`m-deep-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color }} />
          <stop offset="100%" style={{ stopColor: deep }} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#m-halo-${uid})`} />
      {art}
    </svg>
  );
}

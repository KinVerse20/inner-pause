"use client";

import { useId } from "react";

// The six feelings as small illustrated emblems, not line icons: each a
// tiny lit scene in its own colour, with a soft glow. Used on Home's tiles
// and as the stamps in your Journey diary.
//   Sleep: a crescent moon and two stars.     Reset: a sun rising over a horizon.
//   Focus: a candle flame and its halo.        Confidence: a peak catching first light.
//   Calm: a drop, and ripples settling.        Release: a leaf drifting on the wind.
// Anything else (Ground, a Moment) gets the Pause mark.

export type EmblemId = "sleep" | "reset" | "focus" | "confidence" | "calm" | "release";

const TONE: Record<EmblemId, string> = {
  sleep: "var(--ds-outcome-sleep)",
  reset: "var(--ds-outcome-reset)",
  focus: "var(--ds-outcome-focus)",
  confidence: "var(--ds-outcome-confidence)",
  calm: "var(--ds-outcome-calm)",
  release: "var(--ds-outcome-release)",
};

export function isEmblemId(value: string | undefined): value is EmblemId {
  return Boolean(value && value in TONE);
}

export function OutcomeEmblem({ id, className = "" }: { id: string | undefined; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const tone = isEmblemId(id) ? TONE[id] : "var(--ds-accent)";
  const light = `color-mix(in srgb, ${tone} 35%, white)`;
  const deep = `color-mix(in srgb, ${tone} 80%, #1d1b4c)`;

  const defs = (
    <defs>
      <radialGradient id={`halo-${uid}`} cx="50%" cy="45%" r="55%">
        <stop offset="0%" style={{ stopColor: tone, stopOpacity: 0.35 }} />
        <stop offset="100%" style={{ stopColor: tone, stopOpacity: 0 }} />
      </radialGradient>
      <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style={{ stopColor: light }} />
        <stop offset="100%" style={{ stopColor: tone }} />
      </linearGradient>
      <linearGradient id={`deep-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" style={{ stopColor: tone }} />
        <stop offset="100%" style={{ stopColor: deep }} />
      </linearGradient>
    </defs>
  );
  const halo = <circle cx="24" cy="24" r="22" fill={`url(#halo-${uid})`} />;
  const fill = `url(#fill-${uid})`;
  const deepFill = `url(#deep-${uid})`;

  let art: React.ReactNode;
  switch (isEmblemId(id) ? id : undefined) {
    case "sleep":
      art = (
        <>
          <path d="M28.5 12.5a11.5 11.5 0 1 0 7 20.8A13 13 0 0 1 28.5 12.5Z" fill={fill} />
          <path d="M33 11.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z" fill={light} />
          <path d="M37.5 19l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6Z" fill={light} />
        </>
      );
      break;
    case "reset":
      art = (
        <>
          <path d="M14 30a10 10 0 0 1 20 0Z" fill={fill} />
          <path d="M24 14.5v3M14.5 19l2 2M33.5 19l-2 2" stroke={tone} strokeWidth="2" strokeLinecap="round" />
          <path d="M9 30.5h30" stroke={deep} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M12 35.5h24" stroke={tone} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
          <path d="M37 11.5a16 16 0 0 1 3.5 8.5M40.5 20l1.4-3.2M40.5 20l-3.1-1.2" stroke={deep} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7" />
        </>
      );
      break;
    case "focus":
      art = (
        <>
          <circle cx="24" cy="19" r="9" fill={tone} opacity="0.18" />
          <path d="M24 9.5c3.8 4.2 5.6 7.6 5.6 10.4a5.6 5.6 0 0 1-11.2 0c0-2.8 1.8-6.2 5.6-10.4Z" fill={fill} />
          <path d="M24 16.5c1.6 1.9 2.4 3.4 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1.2.8-2.7 2.4-4.6Z" fill="white" opacity="0.85" />
          <rect x="21" y="27.5" width="6" height="11" rx="1.6" fill={deepFill} />
          <path d="M17 38.5h14" stroke={deep} strokeWidth="2" strokeLinecap="round" />
        </>
      );
      break;
    case "confidence":
      art = (
        <>
          <circle cx="31.5" cy="16" r="5" fill={light} />
          <path d="M7 37 20 17l6 8 4-5 11 17Z" fill={deepFill} />
          <path d="M20 17l4.5 6.9-2.6-1.4-1.9 2.6-1.8-2.9-2.3 1.5Z" fill="white" opacity="0.85" />
          <path d="M20 17V10.5" stroke={deep} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M20 10.6l5 1.6-5 1.8Z" fill={light} />
        </>
      );
      break;
    case "calm":
      art = (
        <>
          <ellipse cx="24" cy="31" rx="15" ry="4.8" fill="none" stroke={tone} strokeWidth="1.5" opacity="0.45" />
          <ellipse cx="24" cy="31" rx="9.5" ry="3" fill="none" stroke={tone} strokeWidth="1.7" opacity="0.75" />
          <ellipse cx="24" cy="31" rx="4" ry="1.3" fill={tone} />
          <path d="M24 10c3.2 4.4 4.8 7.6 4.8 9.8a4.8 4.8 0 0 1-9.6 0c0-2.2 1.6-5.4 4.8-9.8Z" fill={fill} />
        </>
      );
      break;
    case "release":
      art = (
        <>
          <path d="M14.5 33.5c-1.5-9.5 4.5-18 18-20.5 1.5 11.5-5.5 19.5-18 20.5Z" fill={fill} />
          <path d="M14.5 33.5c4.5-5.5 9-10 14.5-14.5" stroke={deep} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M7 22c3 0 4-2 7-2M5.5 28c2.5 0 3.5-1.6 6-1.6M30 38c3 0 4.5-2 7.5-2" stroke={tone} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" fill="none" />
        </>
      );
      break;
    default:
      art = (
        <>
          <circle cx="24" cy="24" r="11" fill={fill} />
          <rect x="20" y="18.5" width="2.6" height="11" rx="1.3" fill="white" />
          <rect x="25.4" y="18.5" width="2.6" height="11" rx="1.3" fill="white" />
        </>
      );
  }

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {defs}
      {halo}
      {art}
    </svg>
  );
}

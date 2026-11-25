"use client";

import { useId } from "react";

import type { ProgrammeId } from "@/lib/programme-data";

// One small scene per Practice path, in the same hand as the Moments
// landscapes (components/landscape-scene.tsx): a soft gradient sky, three
// depths of land, one thing that tells the path's story.
//   Confidence: a peak at sunrise, a flag at the top.
//   Uncertainty: a path walking on into soft mist.
//   Focus: a lighthouse, its beam steady over the water.
//   Emotional Regulation: a still lake, one ripple settling.
//   Rest: a moon over sleeping hills.
export function PathScene({ pathId, className = "" }: { pathId: ProgrammeId; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const sky = (top: string, bottom: string) => (
    <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={top} />
      <stop offset="100%" stopColor={bottom} />
    </linearGradient>
  );
  const glow = (color: string) => (
    <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={color} stopOpacity="0.6" />
      <stop offset="100%" stopColor={color} stopOpacity="0" />
    </radialGradient>
  );
  const frame = (defs: React.ReactNode, body: React.ReactNode) => (
    <svg viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>{defs}</defs>
      <rect width="360" height="240" fill={`url(#sky-${uid})`} />
      {body}
    </svg>
  );

  switch (pathId) {
    case "confidence":
      return frame(
        <>
          {sky("#FBE3DA", "#F2C4B8")}
          {glow("#F6B9A0")}
        </>,
        <>
          <circle cx="250" cy="96" r="70" fill={`url(#glow-${uid})`} />
          <circle cx="250" cy="96" r="22" fill="#F7C2A6" />
          <path d="M0 170 L70 120 L120 150 L190 70 L250 140 L300 110 L360 150 V240 H0Z" fill="#E2A79A" />
          <path d="M190 70 L172 92 L182 90 L190 80 L198 92 L208 94Z" fill="#FBEDE6" opacity="0.9" />
          <path d="M190 70 V48" stroke="#9C5A5F" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M190 49 L208 54 L190 60Z" fill="#B4587A" />
          <path d="M0 196 C60 176 120 186 180 176 C250 165 300 178 360 170 V240 H0Z" fill="#C98989" />
          <path d="M40 240 C70 220 110 214 130 196 C150 178 170 160 186 120" stroke="#FBEDE6" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M0 220 C90 208 180 214 360 204 V240 H0Z" fill="#A86A72" />
        </>,
      );
    case "anxiety":
      return frame(
        <>
          {sky("#ECE7F7", "#D9D2EE")}
          {glow("#FFFFFF")}
        </>,
        <>
          <circle cx="205" cy="74" r="60" fill={`url(#glow-${uid})`} />
          <circle cx="205" cy="74" r="18" fill="#F7F4FB" opacity="0.9" />
          <path d="M0 150 C60 132 120 140 180 128 C250 116 300 132 360 124 V240 H0Z" fill="#C6BCE3" />
          <rect x="0" y="128" width="360" height="26" fill="#F4F1FA" opacity="0.65" />
          <path d="M0 180 C80 160 150 172 220 160 C280 150 320 160 360 156 V240 H0Z" fill="#AA9DD6" />
          <rect x="0" y="160" width="360" height="22" fill="#F4F1FA" opacity="0.45" />
          <path d="M150 240 C160 220 175 205 190 190 C200 180 206 170 210 160" stroke="#F7F4FB" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.75" />
          <path d="M0 214 C100 200 220 210 360 198 V240 H0Z" fill="#8C7CC4" />
        </>,
      );
    case "focus":
      return frame(
        <>
          {sky("#FBEBD6", "#F2CFA4")}
          {glow("#FFE2B0")}
        </>,
        <>
          <path d="M182 112 L360 64 V156 Z" fill={`url(#glow-${uid})`} />
          <rect x="0" y="150" width="360" height="90" fill="#E7B98A" />
          <path d="M0 162 H360M20 176 H300M60 190 H340" stroke="#F6D9B4" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <g transform="translate(70 0)">
            <path d="M60 160 C80 140 130 140 150 160Z" fill="#9C6B45" />
            <path d="M98 150 L104 96 H120 L126 150Z" fill="#FBF3E8" />
            <path d="M100 132 H124M102 116 H122" stroke="#C98A4B" strokeWidth="5" />
            <rect x="102" y="82" width="20" height="14" rx="2" fill="#FFD99A" />
            <path d="M100 82 L112 70 L124 82Z" fill="#9C6B45" />
          </g>
          <path d="M0 214 C100 204 220 212 360 202 V240 H0Z" fill="#D79F68" />
        </>,
      );
    case "reactivity":
      return frame(
        <>
          {sky("#E9F1EC", "#CFE1D7")}
          {glow("#FFFFFF")}
        </>,
        <>
          <circle cx="170" cy="80" r="56" fill={`url(#glow-${uid})`} />
          <path d="M0 128 C70 108 140 118 210 106 C280 96 320 110 360 104 V150 H0Z" fill="#A9C6B6" />
          <path d="M0 140 C90 128 170 136 250 126 C300 120 330 128 360 124 V150 H0Z" fill="#8FB09E" />
          <rect x="0" y="148" width="360" height="92" fill="#D6E7DE" />
          <path d="M0 148 C90 156 170 150 250 158 C300 162 330 156 360 158 V172 H0Z" fill="#B8D2C4" opacity="0.6" />
          <ellipse cx="205" cy="196" rx="44" ry="9" fill="none" stroke="#6B9080" strokeWidth="1.6" opacity="0.55" />
          <ellipse cx="200" cy="196" rx="30" ry="5.5" fill="none" stroke="#6B9080" strokeWidth="1.6" opacity="0.75" />
          <ellipse cx="200" cy="196" rx="10" ry="2" fill="#6B9080" opacity="0.8" />
          <path d="M150 230 C152 205 156 192 162 178M162 178 C166 190 164 204 160 230M140 232 C142 214 144 204 148 194" stroke="#5E8070" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>,
      );
    case "sleep":
    default:
      return frame(
        <>
          {sky("#4A4480", "#8E86C6")}
          {glow("#F4F0E6")}
        </>,
        <>
          <circle cx="195" cy="72" r="56" fill={`url(#glow-${uid})`} />
          <circle cx="195" cy="72" r="20" fill="#F4F0E6" />
          <circle cx="203" cy="66" r="18" fill="#5E579A" />
          {[
            [40, 40],
            [90, 70],
            [150, 34],
            [200, 96],
            [320, 40],
            [300, 110],
            [120, 104],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#F4F0E6" opacity="0.85" />
          ))}
          <path d="M0 160 C70 140 140 150 210 138 C280 128 320 142 360 136 V240 H0Z" fill="#6B6499" />
          <path d="M0 192 C90 172 170 184 250 172 C300 166 330 172 360 170 V240 H0Z" fill="#524B85" />
          <path d="M0 222 C100 210 220 218 360 208 V240 H0Z" fill="#3E3870" />
        </>,
      );
  }
}

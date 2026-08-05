"use client";

import type { CSSProperties, ReactNode } from "react";

type WeatherTone = "heavy" | "calm" | "confused" | "hopeful" | "tender" | "neutral";
type OrbStage = "arrive" | "speak" | "write" | "witness" | "transform" | "release" | "breathe" | "restore" | "integrate" | "garden";

const toneStyles: Record<WeatherTone, { glow: string; haze: string; accent: string; label: string }> = {
  heavy: {
    glow: "rgba(235, 101, 38, 0.38)",
    haze: "radial-gradient(circle at 50% 22%, rgba(113, 43, 18, 0.42), transparent 32rem)",
    accent: "#f58b49",
    label: "Heavy",
  },
  calm: {
    glow: "rgba(232, 201, 126, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(171, 132, 44, 0.24), transparent 28rem)",
    accent: "#e8c97e",
    label: "Calm",
  },
  confused: {
    glow: "rgba(145, 107, 196, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(90, 65, 142, 0.28), transparent 30rem)",
    accent: "#b69ae6",
    label: "Unclear",
  },
  hopeful: {
    glow: "rgba(255, 184, 108, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(176, 109, 33, 0.28), transparent 32rem)",
    accent: "#ffb86c",
    label: "Hopeful",
  },
  tender: {
    glow: "rgba(188, 134, 177, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(124, 79, 116, 0.26), transparent 30rem)",
    accent: "#d7a9cc",
    label: "Tender",
  },
  neutral: {
    glow: "rgba(244, 122, 34, 0.28)",
    haze: "radial-gradient(circle at 50% 18%, rgba(81, 63, 44, 0.24), transparent 28rem)",
    accent: "#f47a22",
    label: "Quiet",
  },
};

const stageClassMap: Record<OrbStage, string> = {
  arrive: "ritual-orb--arrive",
  speak: "ritual-orb--speak",
  write: "ritual-orb--write",
  witness: "ritual-orb--witness",
  transform: "ritual-orb--transform",
  release: "ritual-orb--release",
  breathe: "ritual-orb--breathe",
  restore: "ritual-orb--restore",
  integrate: "ritual-orb--integrate",
  garden: "ritual-orb--garden",
};

export function inferWeatherTone(input?: string | null): WeatherTone {
  const value = input?.toLowerCase() ?? "";
  if (!value) return "neutral";
  if (/(stress|overwhelm|anx|anger|heavy|strong|pressure|tired)/.test(value)) return "heavy";
  if (/(sad|grief|lonely|tender|heartbroken|blue)/.test(value)) return "tender";
  if (/(confus|unclear|fog|lost|scatter)/.test(value)) return "confused";
  if (/(calm|clear|still|peace|ground)/.test(value)) return "calm";
  if (/(hope|open|ready|light|relief|grateful)/.test(value)) return "hopeful";
  return "neutral";
}

export function RitualBackdrop({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: WeatherTone;
  className?: string;
}) {
  const style = {
    "--ritual-glow": toneStyles[tone].glow,
    "--ritual-accent": toneStyles[tone].accent,
    "--ritual-haze": toneStyles[tone].haze,
  } as CSSProperties;

  return (
    <section className={`ritual-backdrop ${className}`.trim()} style={style}>
      <div className="ritual-backdrop__veil" />
      <div className="ritual-backdrop__mist" />
      <div className="ritual-backdrop__grid" />
      {children}
    </section>
  );
}

export function RitualWeatherCard({
  title,
  line,
  tone = "neutral",
}: {
  title: string;
  line: string;
  tone?: WeatherTone;
}) {
  return (
    <div className="ritual-weather-card">
      <p className="minimal-label text-[0.62rem]">{title}</p>
      <p className="mt-2 text-sm uppercase tracking-[0.18em]" style={{ color: toneStyles[tone].accent }}>
        {toneStyles[tone].label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{line}</p>
    </div>
  );
}

export function RitualOrb({
  stage,
  tone = "neutral",
  active = true,
  intensity = 0.5,
  label,
  className = "",
}: {
  stage: OrbStage;
  tone?: WeatherTone;
  active?: boolean;
  intensity?: number;
  label?: string;
  className?: string;
}) {
  const clampedIntensity = Math.max(0.15, Math.min(1, intensity));
  const style = {
    "--ritual-glow": toneStyles[tone].glow,
    "--ritual-accent": toneStyles[tone].accent,
    "--ritual-intensity": String(clampedIntensity),
  } as CSSProperties;

  return (
    <div className={`ritual-orb-shell ${active ? "" : "is-paused"} ${className}`.trim()} style={style} aria-label={label}>
      <div className={`ritual-orb ${stageClassMap[stage]}`}>
        <span className="ritual-orb__halo ritual-orb__halo--outer" />
        <span className="ritual-orb__halo ritual-orb__halo--middle" />
        <span className="ritual-orb__halo ritual-orb__halo--inner" />
        <span className="ritual-orb__core" />
        <span className="ritual-orb__pulse" />
        <span className="ritual-orb__track ritual-orb__track--one" />
        <span className="ritual-orb__track ritual-orb__track--two" />
        <span className="ritual-orb__track ritual-orb__track--three" />
        <span className="ritual-orb__particle ritual-orb__particle--one" />
        <span className="ritual-orb__particle ritual-orb__particle--two" />
        <span className="ritual-orb__particle ritual-orb__particle--three" />
        <span className="ritual-orb__particle ritual-orb__particle--four" />
        <span className="ritual-orb__particle ritual-orb__particle--five" />
      </div>
    </div>
  );
}


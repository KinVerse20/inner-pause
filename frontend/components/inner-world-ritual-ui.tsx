"use client";

import type { CSSProperties, ReactNode } from "react";

export type WeatherTone = "heavy" | "calm" | "confused" | "hopeful" | "tender" | "neutral";
type OrbStage =
  | "arrive"
  | "arrive-opening"
  | "speak"
  | "write"
  | "witness"
  | "transform"
  | "release"
  | "breathe"
  | "restore"
  | "integrate"
  | "garden";

export type RitualStageKey =
  | "arrive"
  | "express"
  | "witness"
  | "transform"
  | "heal"
  | "close"
  | "carry-forward"
  | "inner-world";

const toneStyles: Record<WeatherTone, { glow: string; haze: string; accent: string; label: string; scene: string }> = {
  heavy: {
    glow: "rgba(235, 101, 38, 0.38)",
    haze: "radial-gradient(circle at 50% 22%, rgba(113, 43, 18, 0.42), transparent 32rem)",
    accent: "#f58b49",
    label: "Heavy Fog",
    scene: "linear-gradient(180deg, rgba(7,11,27,0.18), rgba(10,14,34,0.72)), radial-gradient(circle at 50% 78%, rgba(220,111,74,0.18), transparent 24rem), linear-gradient(180deg, #10172f 0%, #151d39 38%, #2d2948 60%, #10172a 100%)",
  },
  calm: {
    glow: "rgba(232, 201, 126, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(171, 132, 44, 0.24), transparent 28rem)",
    accent: "#e8c97e",
    label: "Quiet Dawn",
    scene: "linear-gradient(180deg, rgba(8,12,29,0.14), rgba(11,18,38,0.78)), radial-gradient(circle at 52% 78%, rgba(238,202,128,0.2), transparent 24rem), linear-gradient(180deg, #111936 0%, #242449 42%, #5b4c70 62%, #17233f 100%)",
  },
  confused: {
    glow: "rgba(145, 107, 196, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(90, 65, 142, 0.28), transparent 30rem)",
    accent: "#b69ae6",
    label: "Quiet Rain",
    scene: "linear-gradient(180deg, rgba(8,12,29,0.18), rgba(11,18,38,0.8)), radial-gradient(circle at 50% 78%, rgba(183,153,229,0.14), transparent 22rem), linear-gradient(180deg, #0f1736 0%, #26254a 38%, #655273 58%, #15213c 100%)",
  },
  hopeful: {
    glow: "rgba(255, 184, 108, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(176, 109, 33, 0.28), transparent 32rem)",
    accent: "#ffb86c",
    label: "Golden Sunrise",
    scene: "linear-gradient(180deg, rgba(8,12,29,0.14), rgba(11,18,38,0.76)), radial-gradient(circle at 50% 78%, rgba(255,188,110,0.22), transparent 24rem), linear-gradient(180deg, #141b38 0%, #2c294d 36%, #8a6075 60%, #17253f 100%)",
  },
  tender: {
    glow: "rgba(188, 134, 177, 0.34)",
    haze: "radial-gradient(circle at 50% 18%, rgba(124, 79, 116, 0.26), transparent 30rem)",
    accent: "#d7a9cc",
    label: "Warm Dusk",
    scene: "linear-gradient(180deg, rgba(8,12,29,0.18), rgba(11,18,38,0.78)), radial-gradient(circle at 50% 78%, rgba(215,169,204,0.16), transparent 24rem), linear-gradient(180deg, #121a37 0%, #2a284d 38%, #775970 60%, #16223e 100%)",
  },
  neutral: {
    glow: "rgba(244, 122, 34, 0.28)",
    haze: "radial-gradient(circle at 50% 18%, rgba(81, 63, 44, 0.24), transparent 28rem)",
    accent: "#f47a22",
    label: "Clear Night",
    scene: "linear-gradient(180deg, rgba(8,12,29,0.16), rgba(11,18,38,0.8)), radial-gradient(circle at 50% 78%, rgba(244,122,34,0.14), transparent 24rem), linear-gradient(180deg, #101934 0%, #242447 38%, #5b4f70 60%, #15213d 100%)",
  },
};

const stageClassMap: Record<OrbStage, string> = {
  arrive: "ritual-orb--arrive",
  "arrive-opening": "ritual-orb--arrive-opening",
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

export const ritualStages: Array<{ key: RitualStageKey; label: string }> = [
  { key: "arrive", label: "Arrive" },
  { key: "express", label: "Express" },
  { key: "witness", label: "Witness" },
  { key: "transform", label: "Transform" },
  { key: "heal", label: "Heal" },
  { key: "close", label: "Close" },
  { key: "carry-forward", label: "Carry Forward" },
];

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
    "--ritual-scene": toneStyles[tone].scene,
  } as CSSProperties;

  return (
    <section className={`ritual-backdrop ${className}`.trim()} style={style}>
      <div className="ritual-backdrop__scene" />
      <div className="ritual-backdrop__mountains" />
      <div className="ritual-backdrop__water" />
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

export function RitualProgress({
  current,
  compact = false,
}: {
  current: RitualStageKey;
  compact?: boolean;
}) {
  if (compact) {
    const label = current === "inner-world" ? "Inner World" : ritualStages.find((stage) => stage.key === current)?.label ?? "Arrive";
    return (
      <div className="ritual-progress ritual-progress--compact">
        <span className="ritual-progress__dot ritual-progress__dot--active" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <nav aria-label="Ritual progress" className="ritual-progress">
      {ritualStages.map((stage, index) => {
        const active = stage.key === current;
        return (
          <div key={stage.key} className={`ritual-progress__item ${active ? "is-active" : ""}`}>
            <span className={`ritual-progress__dot ${active ? "ritual-progress__dot--active" : ""}`} />
            <span>{stage.label}</span>
            {index < ritualStages.length - 1 ? <span className="ritual-progress__line" /> : null}
          </div>
        );
      })}
      <div className={`ritual-progress__item ${current === "inner-world" ? "is-active" : ""}`}>
        <span className={`ritual-progress__dot ${current === "inner-world" ? "ritual-progress__dot--active" : ""}`} />
        <span>Inner World</span>
      </div>
    </nav>
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
        <span className="ritual-orb__lotus" />
        <span className="ritual-orb__track ritual-orb__track--one" />
        <span className="ritual-orb__track ritual-orb__track--two" />
        <span className="ritual-orb__track ritual-orb__track--three" />
        <span className="ritual-orb__release ritual-orb__release--one" />
        <span className="ritual-orb__release ritual-orb__release--two" />
        <span className="ritual-orb__release ritual-orb__release--three" />
        <span className="ritual-orb__particle ritual-orb__particle--one" />
        <span className="ritual-orb__particle ritual-orb__particle--two" />
        <span className="ritual-orb__particle ritual-orb__particle--three" />
        <span className="ritual-orb__particle ritual-orb__particle--four" />
        <span className="ritual-orb__particle ritual-orb__particle--five" />
      </div>
    </div>
  );
}

export function WitnessConstellation({
  emotions,
}: {
  emotions: Array<{ name: string; explanation?: string; intensity?: number }>;
}) {
  const paletteFor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("stress") || lower.includes("anger")) return "#eb6526";
    if (lower.includes("sad")) return "#6f84c0";
    if (lower.includes("confus")) return "#b69ae6";
    return "#e2c06c";
  };

  return (
    <div className="witness-field" aria-hidden="true">
      <div className="witness-field__wave witness-field__wave--warm" />
      <div className="witness-field__wave witness-field__wave--cool" />
      <div className="witness-field__burst" />
      {emotions.slice(0, 4).map((emotion, index) => (
        <div
          key={emotion.name}
          className={`witness-field__cluster witness-field__cluster--${index + 1}`}
          style={{ "--cluster-color": paletteFor(emotion.name) } as CSSProperties}
        >
          <span className="witness-field__cluster-label">{emotion.name}</span>
          <span className="witness-field__cluster-core" />
        </div>
      ))}
      <div className="witness-field__gold-orb" />
    </div>
  );
}

export function TransformStream({
  labels,
}: {
  labels: string[];
}) {
  return (
    <div className="transform-stream" aria-hidden="true">
      <div className="transform-stream__cluster-list">
        {labels.slice(0, 6).map((label, index) => (
          <span key={`${label}-${index}`} className={`transform-stream__cluster transform-stream__cluster--${index + 1}`}>
            {label}
          </span>
        ))}
      </div>
      <div className="transform-stream__flow transform-stream__flow--one" />
      <div className="transform-stream__flow transform-stream__flow--two" />
      <div className="transform-stream__flow transform-stream__flow--three" />
      <div className="transform-stream__target">
        <span className="transform-stream__target-lotus" />
      </div>
    </div>
  );
}

export function BeforeAfterShift({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  return (
    <div className="before-after-shift" aria-hidden="true">
      <div className="before-after-shift__before">
        <span>{before}</span>
      </div>
      <div className="before-after-shift__path" />
      <div className="before-after-shift__after">
        <span>{after}</span>
      </div>
    </div>
  );
}

export function InnerWorldScene({
  reflections,
  sessions,
}: {
  reflections: number;
  sessions: number;
}) {
  const flowers = Math.max(4, Math.min(12, reflections));
  const lights = Math.max(6, Math.min(18, sessions * 2));

  return (
    <div className="inner-world-scene" aria-hidden="true">
      <div className="inner-world-scene__tree" />
      <div className="inner-world-scene__trunk" />
      <div className="inner-world-scene__pool" />
      {Array.from({ length: flowers }).map((_, index) => (
        <span
          key={`flower-${index}`}
          className={`inner-world-scene__flower inner-world-scene__flower--${(index % 6) + 1}`}
          style={{
            left: `${8 + ((index * 13) % 76)}%`,
            bottom: `${6 + ((index * 7) % 24)}%`,
            animationDelay: `${index * 0.22}s`,
          }}
        />
      ))}
      {Array.from({ length: lights }).map((_, index) => (
        <span
          key={`light-${index}`}
          className="inner-world-scene__light"
          style={{
            left: `${10 + ((index * 11) % 80)}%`,
            top: `${10 + ((index * 9) % 62)}%`,
            animationDelay: `${index * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

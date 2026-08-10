"use client";

import type { CSSProperties } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { chakraMap } from "@/data/chakras";
import { getChakraSoundVisualMode, type ChakraSoundStyle } from "@/lib/chakra-audio";
import type { ChakraId } from "@/lib/types";

const particlePalette = ["#76c8ed", "#8e7bec", "#cf78c7", "#ef8b6c", "#e9bf65", "#55cba9"];

export function BreathingRipple({
  label = "Breathe in",
  active = true,
  className = "",
}: {
  label?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={`breath-ripple ${active ? "is-active" : "is-paused"} ${className}`.trim()} aria-label="Breathing ripple">
      <span className="breath-ripple__aura" />
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={`ring-${index}`} className="breath-ripple__ring" style={{ "--ring-index": index } as CSSProperties} />
      ))}
      {Array.from({ length: 10 }).map((_, index) => (
        <span
          key={`particle-${index}`}
          className="breath-ripple__particle"
          style={{
            "--particle-index": index,
            "--particle-angle": `${index * 36}deg`,
          } as CSSProperties}
        />
      ))}
      <span className="breath-ripple__core">{label}</span>
    </div>
  );
}

export function EnergyParticleField({ keywords }: { keywords: string[] }) {
  const visibleKeywords = keywords.filter(Boolean).slice(0, 5);

  return (
    <div className="energy-particle-field" aria-label="Turning your reflection into chakra patterns">
      <div className="energy-particle-field__nebula" />
      <div className="energy-particle-field__orbit energy-particle-field__orbit--one" />
      <div className="energy-particle-field__orbit energy-particle-field__orbit--two" />
      <div className="energy-particle-field__core" />
      {Array.from({ length: 42 }).map((_, index) => (
        <span
          key={`energy-${index}`}
          className="energy-particle-field__particle"
          style={{
            "--particle-x": `${8 + ((index * 37) % 84)}%`,
            "--particle-y": `${7 + ((index * 53) % 86)}%`,
            "--particle-delay": `${-(index % 12) * 0.32}s`,
            "--particle-duration": `${5.8 + (index % 7) * 0.55}s`,
            "--particle-color": particlePalette[index % particlePalette.length],
          } as CSSProperties}
        />
      ))}
      {visibleKeywords.map((keyword, index) => (
        <span
          key={`${keyword}-${index}`}
          className="energy-particle-field__keyword"
          style={{
            "--keyword-x": `${16 + ((index * 19) % 62)}%`,
            "--keyword-y": `${18 + ((index * 23) % 58)}%`,
            "--keyword-delay": `${index * 0.45}s`,
          } as CSSProperties}
        >
          {keyword}
        </span>
      ))}
    </div>
  );
}

export function ChakraResultsReveal({ chakraIds }: { chakraIds: ChakraId[] }) {
  const uniqueChakras = [...new Set(chakraIds)].slice(0, 4);

  return (
    <div className="chakra-results-reveal" aria-label="Chakras recommended for this session">
      {uniqueChakras.map((chakraId, index) => {
        const chakra = chakraMap[chakraId];
        return (
          <article
            key={chakra.id}
            className="chakra-result-card"
            style={{
              "--chakra-color": chakra.color,
              "--chakra-delay": `${index * 190}ms`,
            } as CSSProperties}
          >
            <div className="chakra-result-card__symbol">
              <ChakraGlyph chakraId={chakra.id} className="h-12 w-12" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-2xl text-[var(--ip-ink)]">{chakra.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: chakra.accent }}>{chakra.frequencyLabel}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{chakra.meaning}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function HealingVisualizer({
  chakraId,
  soundStyle,
  active,
  stage,
}: {
  chakraId: ChakraId;
  soundStyle: ChakraSoundStyle;
  active: boolean;
  stage: "release" | "breathe" | "restore" | "integrate";
}) {
  const chakra = chakraMap[chakraId];
  const visualMode = getChakraSoundVisualMode(soundStyle);
  const style = {
    "--healing-color": chakra.color,
    "--healing-accent": chakra.accent,
    "--healing-glow": chakra.glow,
  } as CSSProperties;

  return (
    <div
      key={`${chakraId}-${soundStyle}`}
      data-visual-style={soundStyle}
      className={`healing-visualizer healing-visualizer--${visualMode} healing-visualizer--${stage} ${active ? "is-playing" : "is-paused"}`}
      style={style}
      aria-label={`${chakra.name} ${soundStyle} visualizer`}
    >
      <div className="healing-visualizer__sky" />
      <div className="healing-visualizer__halo" />
      <div className="healing-visualizer__orbital healing-visualizer__orbital--outer" />
      <div className="healing-visualizer__orbital healing-visualizer__orbital--inner" />
      <div className="healing-visualizer__surface" />
      <div className="healing-visualizer__chakra">
        <ChakraGlyph chakraId={chakraId} className="h-20 w-20 sm:h-24 sm:w-24" />
      </div>

      {soundStyle === "rain" ? (
        <>
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={`rain-${index}`} className="healing-rain-drop" style={{ "--drop-index": index } as CSSProperties} />
          ))}
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={`rain-ring-${index}`} className="healing-water-ring" style={{ "--ring-index": index } as CSSProperties} />
          ))}
        </>
      ) : null}

      {soundStyle === "forest" ? (
        <>
          <span className="healing-forest-mist healing-forest-mist--one" />
          <span className="healing-forest-mist healing-forest-mist--two" />
          {Array.from({ length: 14 }).map((_, index) => (
            <span key={`forest-${index}`} className="healing-forest-light" style={{ "--light-index": index } as CSSProperties} />
          ))}
        </>
      ) : null}

      {soundStyle === "piano" ? (
        <div className="healing-piano-wave" aria-hidden="true">
          {Array.from({ length: 25 }).map((_, index) => (
            <span key={`piano-${index}`} style={{ "--bar-index": index } as CSSProperties} />
          ))}
        </div>
      ) : null}

      {soundStyle === "ambient" ? (
        <>
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={`star-${index}`} className="healing-ambient-star" style={{ "--star-index": index } as CSSProperties} />
          ))}
          <span className="healing-ambient-beam" />
        </>
      ) : null}
    </div>
  );
}

export function SoundStyleTileVisual({ style }: { style: ChakraSoundStyle }) {
  return (
    <span className={`sound-style-visual sound-style-visual--${style}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function CompletionBloom() {
  return (
    <div className="completion-bloom" aria-label="Session complete">
      <span className="completion-bloom__beam" />
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={`completion-ring-${index}`} className="completion-bloom__ring" style={{ "--ring-index": index } as CSSProperties} />
      ))}
      <span className="completion-bloom__lotus">
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={`petal-${index}`} className="completion-bloom__petal" style={{ "--petal-index": index } as CSSProperties} />
        ))}
        <span className="completion-bloom__heart" />
      </span>
      {Array.from({ length: 12 }).map((_, index) => (
        <span key={`completion-light-${index}`} className="completion-bloom__light" style={{ "--light-index": index } as CSSProperties} />
      ))}
    </div>
  );
}

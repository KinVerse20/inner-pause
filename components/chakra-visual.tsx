"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

import { ChakraDefinition } from "@/lib/types";

export const CHAKRA_SCENE_CHANGE_SECONDS = 50;
export const CHAKRA_SCENE_ORDER = [
  "Energy Orb",
  "Mandala Bloom",
  "Flowing Waves",
  "Lotus or Cosmic Light",
  "Psychedelic Kaleidoscope",
] as const;

const SCENE_TRANSITION_MS = 4000;
const SCENE_KEYS = ["orb", "mandala", "waves", "lotus", "kaleidoscope"] as const;

const particleOffsets = [
  { top: "14%", left: "18%", delay: "0s", duration: "16s", size: "0.45rem" },
  { top: "22%", right: "16%", delay: "3s", duration: "20s", size: "0.35rem" },
  { top: "38%", left: "10%", delay: "6s", duration: "18s", size: "0.3rem" },
  { top: "34%", right: "9%", delay: "1.5s", duration: "21s", size: "0.5rem" },
  { bottom: "29%", left: "14%", delay: "4s", duration: "17s", size: "0.38rem" },
  { bottom: "18%", right: "18%", delay: "8s", duration: "19s", size: "0.42rem" },
  { bottom: "8%", left: "46%", delay: "10s", duration: "22s", size: "0.28rem" },
];

export function ChakraVisual({
  chakra,
  breathLabel,
  reducedMotion = false,
  elapsedSeconds = 0,
  motionPaused = false,
}: {
  chakra: ChakraDefinition;
  breathLabel?: string;
  reducedMotion?: boolean;
  elapsedSeconds?: number;
  motionPaused?: boolean;
}) {
  const sceneIndex = reducedMotion
    ? 0
    : Math.floor(elapsedSeconds / CHAKRA_SCENE_CHANGE_SECONDS) % SCENE_KEYS.length;
  const [displaySceneIndex, setDisplaySceneIndex] = useState(sceneIndex);
  const [previousSceneIndex, setPreviousSceneIndex] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion || sceneIndex === displaySceneIndex) return;

    let timeout = 0;
    const frame = window.requestAnimationFrame(() => {
      setPreviousSceneIndex(displaySceneIndex);
      setDisplaySceneIndex(sceneIndex);
      timeout = window.setTimeout(() => {
        setPreviousSceneIndex(null);
      }, SCENE_TRANSITION_MS);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [displaySceneIndex, reducedMotion, sceneIndex]);

  const sceneDots = useMemo(
    () => SCENE_KEYS.map((_, index) => index === displaySceneIndex),
    [displaySceneIndex],
  );

  return (
    <div
      className={`chakra-scene ${motionPaused ? "chakra-scene--paused" : ""} relative flex h-[42svh] min-h-[19rem] w-full items-center justify-center overflow-hidden sm:h-[54svh] sm:min-h-[28rem]`}
      style={
        {
          "--chakra-core": chakra.color,
          "--chakra-accent": chakra.accent,
          "--chakra-glow": chakra.glow,
        } as CSSProperties
      }
    >
      <div className="chakra-aura absolute inset-0 rounded-[2.5rem]" />
      <div className="chakra-vignette absolute inset-0 rounded-[2.5rem]" />

      <div className="chakra-scene-stack absolute inset-0">
        {previousSceneIndex !== null ? (
          <SceneLayer
            reducedMotion={reducedMotion}
            scene={SCENE_KEYS[previousSceneIndex]}
            state="exit"
          />
        ) : null}
        <SceneLayer
          reducedMotion={reducedMotion}
          scene={SCENE_KEYS[displaySceneIndex]}
          state="enter"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="chakra-orb-label">
          <p className="text-xs uppercase tracking-[0.32em] text-white/60">Breath</p>
          <p className="mt-3 text-2xl font-medium text-white/95 sm:text-3xl">
            {breathLabel ?? chakra.name.replace(" Chakra", "")}
          </p>
        </div>
      </div>

      {!reducedMotion ? (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {sceneDots.map((active, index) => (
            <span
              key={`${chakra.id}-scene-dot-${index}`}
              className={`chakra-scene-dot ${active ? "chakra-scene-dot--active" : ""}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SceneLayer({
  reducedMotion,
  scene,
  state,
}: {
  reducedMotion: boolean;
  scene: (typeof SCENE_KEYS)[number];
  state: "enter" | "exit";
}) {
  return (
    <div className={`chakra-scene-layer chakra-scene-layer--${state}`}>
      {scene === "orb" ? <EnergyOrbScene reducedMotion={reducedMotion} /> : null}
      {scene === "mandala" ? <MandalaBloomScene reducedMotion={reducedMotion} /> : null}
      {scene === "waves" ? <FlowingWavesScene reducedMotion={reducedMotion} /> : null}
      {scene === "lotus" ? <LotusLightScene reducedMotion={reducedMotion} /> : null}
      {scene === "kaleidoscope" ? <PsychedelicKaleidoscopeScene reducedMotion={reducedMotion} /> : null}
    </div>
  );
}

function SharedParticles({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="chakra-particle-field absolute inset-0">
      {particleOffsets.map((particle, index) => (
        <span
          key={`particle-${index}`}
          className={`chakra-particle ${reducedMotion ? "chakra-particle--static" : ""}`}
          style={{
            ...particle,
            width: particle.size,
            height: particle.size,
          }}
        />
      ))}
    </div>
  );
}

function EnergyOrbScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((ring) => (
          <div
            key={ring}
            className={`chakra-energy-ring ${reducedMotion ? "chakra-energy-ring--static" : ""}`}
            style={{ animationDelay: `${ring * 3.3}s` }}
          />
        ))}
      </div>
      <SharedParticles reducedMotion={reducedMotion} />
      <div className="relative z-10 flex flex-col items-center">
        <div className={`chakra-orb-immersive ${reducedMotion ? "chakra-orb-immersive--still" : ""}`}>
          <div className="chakra-orb-halo" />
          <div className="chakra-orb-sheen" />
          <div className="chakra-orb-inner-ring" />
          <div className="chakra-orb-inner-core" />
        </div>
      </div>
    </>
  );
}

function MandalaBloomScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <SharedParticles reducedMotion={reducedMotion} />
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className={`chakra-mandala ${reducedMotion ? "chakra-mandala--still" : ""}`}>
          <div className="chakra-mandala-core" />
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={`petal-${index}`}
              className="chakra-mandala-petal"
              style={{ transform: `rotate(${index * 30}deg) translateY(-45%)` }}
            />
          ))}
          <div className="chakra-mandala-ring chakra-mandala-ring--outer" />
          <div className="chakra-mandala-ring chakra-mandala-ring--inner" />
        </div>
      </div>
    </>
  );
}

function FlowingWavesScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <SharedParticles reducedMotion={reducedMotion} />
      <div className="chakra-wave-field absolute inset-0">
        <div className={`chakra-wave chakra-wave--one ${reducedMotion ? "chakra-wave--still" : ""}`} />
        <div className={`chakra-wave chakra-wave--two ${reducedMotion ? "chakra-wave--still" : ""}`} />
        <div className={`chakra-wave chakra-wave--three ${reducedMotion ? "chakra-wave--still" : ""}`} />
        <div className={`chakra-wave-glow chakra-wave-glow--one ${reducedMotion ? "chakra-wave-glow--still" : ""}`} />
        <div className={`chakra-wave-glow chakra-wave-glow--two ${reducedMotion ? "chakra-wave-glow--still" : ""}`} />
        <div className={`chakra-wave-orbit ${reducedMotion ? "chakra-wave-orbit--still" : ""}`} />
      </div>
    </>
  );
}

function LotusLightScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <div className={`chakra-light-beam ${reducedMotion ? "chakra-light-beam--still" : ""}`} />
      <div className="chakra-cosmic-field absolute inset-0">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={`star-${index}`}
            className={`chakra-cosmic-star ${reducedMotion ? "chakra-cosmic-star--still" : ""}`}
            style={{
              top: `${14 + index * 8}%`,
              left: `${index % 2 === 0 ? 24 + index * 6 : 68 - index * 4}%`,
              animationDelay: `${index * 1.2}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className={`chakra-lotus ${reducedMotion ? "chakra-lotus--still" : ""}`}>
          <div className="chakra-lotus-center" />
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={`lotus-petal-${index}`}
              className={`chakra-lotus-petal chakra-lotus-petal--${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function PsychedelicKaleidoscopeScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <SharedParticles reducedMotion={reducedMotion} />
      <div className={`chakra-kaleidoscope ${reducedMotion ? "chakra-kaleidoscope--still" : ""}`}>
        <div className="chakra-kaleidoscope-core" />
        <div className="chakra-kaleidoscope-symbol" />
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={`kaleidoscope-petal-${index}`}
            className="chakra-kaleidoscope-petal"
            style={{ transform: `rotate(${index * 30}deg) translateY(-44%)` }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={`kaleidoscope-trail-${index}`}
            className="chakra-kaleidoscope-trail"
            style={{ transform: `rotate(${index * 60}deg)` }}
          />
        ))}
      </div>
    </>
  );
}

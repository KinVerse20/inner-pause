"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";

import { RESONANCES, resonanceGainDb } from "@inner-pause/shared";

// Plays a Pause's selected sound (river, rain…), tuned to the Pause's
// frequency, with fades, volume and mute.
//
// Most of the time the player plays a file the server already rendered:
// tuned, levelled and seamlessly looped (backend/src/renderer.ts). That
// file plays straight from the <audio> element — which also keeps playing
// with the phone locked — and this hook only fades it and mutes it.
//
// Until a rendering is ready (or while the dev frequency tester overrides
// the frequency) the original upload is tuned live instead: the element is
// routed through Web Audio resonant filters centred on the frequency and its
// octave (the same resonances the server applies, shared/src/tuning.ts), so
// the sound's own energy at that frequency is drawn out. Nothing is
// synthesised: with the filters flat, only the original recording remains.

// Frequency and volume changes glide rather than jump.
const GLIDE_SECONDS = 0.05;
const RESONANCE_FADE_SECONDS = 0.15;

// Fades follow a squared curve, which the ear hears as an even swell
// rather than a quick jump followed by a long plateau.
const FADE_CURVE_POINTS = 64;
const ELEMENT_FADE_STEP_MS = 50;

interface Resonator {
  node: BiquadFilterNode;
  ratio: number;
  gainDb: number;
}

interface TunedGraph {
  ctx: AudioContext;
  /** Loudness correction, so the original matches the rendered level. */
  trim: GainNode;
  resonators: Resonator[];
  /** Fade in/out, kept separate so fades never fight volume or mute. */
  envelope: GainNode;
  /** Volume and mute. */
  output: GainNode;
}

type AudioContextConstructor = new () => AudioContext;

// A media element can be connected to Web Audio only once, ever. React's
// development Strict Mode unmounts and remounts effects on the same element,
// so the graph is cached per element and only closed if no remount follows.
const graphs = new WeakMap<HTMLMediaElement, { graph: TunedGraph; closeTimer?: number }>();

function buildGraph(audio: HTMLMediaElement): TunedGraph | null {
  const audioWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
  const Ctor: AudioContextConstructor | undefined = window.AudioContext ?? audioWindow.webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  let source: MediaElementAudioSourceNode;
  try {
    source = ctx.createMediaElementSource(audio);
  } catch {
    void ctx.close();
    return null;
  }

  const trim = ctx.createGain();
  const resonators = RESONANCES.map(({ ratio, gainDb, q }) => {
    const node = ctx.createBiquadFilter();
    node.type = "peaking";
    node.Q.value = q;
    node.gain.value = 0;
    return { node, ratio, gainDb };
  });

  // A safety limiter: a recording with strong content right at the
  // frequency is boosted by the resonance, and must never clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 3;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;

  const envelope = ctx.createGain();
  const output = ctx.createGain();
  output.gain.value = 0;

  let tail: AudioNode = source.connect(trim);
  for (const { node } of resonators) {
    tail.connect(node);
    tail = node;
  }
  tail.connect(limiter).connect(envelope).connect(output).connect(ctx.destination);

  // Once routed, the element's own volume/mute no longer apply cleanly;
  // the graph's output gain is the volume control from here on.
  audio.volume = 1;
  audio.muted = false;
  return { ctx, trim, resonators, envelope, output };
}

const fadeCurveValue = (target: 0 | 1, from: number, t: number) => (target === 1 ? from + (1 - from) * t * t : from * (1 - t) * (1 - t));

// Fades the graph's envelope from `from` to `target`.
function fadeGraph(graph: TunedGraph, target: 0 | 1, seconds: number, from: number) {
  const gain = graph.envelope.gain;
  const now = graph.ctx.currentTime;
  gain.cancelScheduledValues(now);
  if (seconds <= 0) {
    gain.setValueAtTime(target, now);
    return;
  }
  const curve = new Float32Array(FADE_CURVE_POINTS);
  for (let i = 0; i < FADE_CURVE_POINTS; i++) curve[i] = fadeCurveValue(target, from, i / (FADE_CURVE_POINTS - 1));
  try {
    gain.setValueCurveAtTime(curve, now, seconds);
  } catch {
    // Older engines refuse a curve that overlaps one still running; an
    // exponential approach is a close enough fade.
    gain.setValueAtTime(from, now);
    gain.setTargetAtTime(target, now, seconds / 4);
  }
}

interface TunedSoundOptions {
  /** Tune live: route the element through Web Audio (the original upload is playing). */
  enabled: boolean;
  /** null = no tuning. Only applies while routed. */
  frequencyHz: number | null;
  volume: number;
  muted: boolean;
  /** Loudness correction (dB) for the original. Only applies while routed. */
  trimDb: number;
}

/**
 * Fades, volume and mute for `audioRef`'s element, plus live tuning when
 * `enabled`. The element is routed through Web Audio the first time
 * `enabled` is true and stays routed until unmount (routing can't be
 * undone); before that, everything is applied to the element itself.
 * The returned object is stable.
 */
export function useTunedSound(audioRef: RefObject<HTMLAudioElement | null>, options: TunedSoundOptions) {
  const graphRef = useRef<TunedGraph | null>(null);
  const elementRef = useRef<HTMLMediaElement | null>(null);
  // While not routed: the fade level applied to the element's volume.
  const envelopeRef = useRef(1);
  const fadeTimerRef = useRef<number | undefined>(undefined);
  const settingsRef = useRef({ volume: options.volume, muted: options.muted });
  const { enabled, frequencyHz, volume, muted, trimDb } = options;

  const api = useMemo(() => {
    const applyToElement = () => {
      const audio = audioRef.current;
      if (!audio || graphRef.current) return;
      audio.muted = settingsRef.current.muted;
      try {
        // Read-only on iPhone, where the rendered file's own level applies.
        audio.volume = Math.min(1, Math.max(0, envelopeRef.current * settingsRef.current.volume));
      } catch {}
    };
    const fade = (target: 0 | 1, seconds: number, from: number) => {
      window.clearInterval(fadeTimerRef.current);
      if (graphRef.current) {
        fadeGraph(graphRef.current, target, seconds, from);
        return;
      }
      const startedAt = performance.now();
      const step = () => {
        const t = seconds > 0 ? Math.min(1, (performance.now() - startedAt) / (seconds * 1000)) : 1;
        envelopeRef.current = fadeCurveValue(target, from, t);
        applyToElement();
        if (t >= 1) window.clearInterval(fadeTimerRef.current);
      };
      step();
      if (seconds > 0) fadeTimerRef.current = window.setInterval(step, ELEMENT_FADE_STEP_MS);
    };
    const currentLevel = () => (graphRef.current ? graphRef.current.envelope.gain.value : envelopeRef.current);
    return {
      applyToElement,
      isRouted: () => graphRef.current !== null,
      resume: () => {
        void graphRef.current?.ctx.resume();
      },
      /** Swells up from silence over `seconds`. */
      fadeIn: (seconds: number) => fade(1, seconds, 0),
      /** Fades to silence over `seconds`, from `from` (default: the current level). */
      fadeOut: (seconds: number, from?: number) => fade(0, seconds, from ?? currentLevel()),
    };
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!enabled || !audio || graphRef.current || typeof window === "undefined") return;

    let entry = graphs.get(audio);
    if (entry) {
      window.clearTimeout(entry.closeTimer);
      entry.closeTimer = undefined;
    } else {
      const graph = buildGraph(audio);
      if (!graph) return;
      entry = { graph };
      graphs.set(audio, entry);
    }
    // Carry on at the level the element was at (it may be mid-Pause).
    window.clearInterval(fadeTimerRef.current);
    entry.graph.envelope.gain.value = envelopeRef.current;
    graphRef.current = entry.graph;
    elementRef.current = audio;
  }, [enabled, audioRef]);

  // Release the graph on unmount, unless an immediate remount (Strict Mode
  // in development) picks it back up.
  useEffect(
    () => () => {
      window.clearInterval(fadeTimerRef.current);
      const audio = elementRef.current;
      const entry = audio ? graphs.get(audio) : undefined;
      graphRef.current = null;
      if (!audio || !entry) return;
      entry.closeTimer = window.setTimeout(() => {
        graphs.delete(audio);
        void entry.graph.ctx.close();
      }, 0);
    },
    [],
  );

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const now = graph.ctx.currentTime;
    const ceiling = graph.ctx.sampleRate * 0.45;
    for (const resonator of graph.resonators) {
      if (frequencyHz) {
        const hz = Math.min(frequencyHz * resonator.ratio, ceiling);
        resonator.node.frequency.setTargetAtTime(hz, now, GLIDE_SECONDS);
        resonator.node.gain.setTargetAtTime(resonanceGainDb(resonator.gainDb, hz), now, RESONANCE_FADE_SECONDS);
      } else {
        resonator.node.gain.setTargetAtTime(0, now, RESONANCE_FADE_SECONDS);
      }
    }
  }, [frequencyHz, enabled]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.trim.gain.setTargetAtTime(10 ** (trimDb / 20), graph.ctx.currentTime, GLIDE_SECONDS);
  }, [trimDb, enabled]);

  useEffect(() => {
    settingsRef.current = { volume, muted };
    const graph = graphRef.current;
    if (graph) graph.output.gain.setTargetAtTime(muted ? 0 : volume, graph.ctx.currentTime, GLIDE_SECONDS);
    else api.applyToElement();
  }, [volume, muted, enabled, api]);

  return api;
}

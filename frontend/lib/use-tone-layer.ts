"use client";

import { useEffect, useRef } from "react";

// A generated frequency layer for the Pause Player (docs/PRODUCT_FLOW.md §8's
// "frequency / tonal layer"): a soft tone at the Pause's own frequency,
// played only when the Pause has no sound of its own. A Pause with a sound
// is tuned to the frequency instead (lib/use-tuned-sound.ts). Built
// with the Web Audio API so any frequency can be produced without a
// separate recorded file per frequency. Prototype: one tone per Pause,
// driven only by the frequency the Pause already carries.

// Kept well under the track: the tone should be felt more than heard.
const PEAK_GAIN = 0.05;
const FADE_IN_SECONDS = 4;
const FADE_OUT_SECONDS = 1.5;

// A slow swell, roughly one breath every ten seconds, so the tone never
// sits perfectly static (docs/DESIGN_SYSTEM.md §8's "breathing motion").
const BREATH_HZ = 0.1;
const BREATH_DEPTH = 0.25;

// Two sines a fraction of a hertz apart beat very slowly against each
// other, which reads as warmer and less clinical than one pure sine.
const VOICE_DETUNE_HZ = 0.4;
const SUB_OCTAVE_LEVEL = 0.35;

// Frequency changes glide rather than jump, so a new pitch never clicks.
const GLIDE_SECONDS = 0.6;
const FILTER_RATIO = 2.5;

export function parseFrequencyHz(label: string): number | null {
  const match = /([\d.]+)\s*Hz/i.exec(label);
  const hz = match ? Number(match[1]) : NaN;
  return Number.isFinite(hz) && hz > 0 ? hz : null;
}

interface ToneVoice {
  osc: OscillatorNode;
  ratio: number;
  offsetHz: number;
}

interface ToneGraph {
  ctx: AudioContext;
  master: GainNode;
  filter: BiquadFilterNode;
  voices: ToneVoice[];
  /** No frequency applied yet — the first one is set instantly, later ones glide. */
  fresh: boolean;
}

type AudioContextConstructor = new () => AudioContext;

function buildGraph(): ToneGraph | null {
  const audioWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
  const Ctor: AudioContextConstructor | undefined = window.AudioContext ?? audioWindow.webkitAudioContext;
  if (!Ctor) return null;

  const ctx = new Ctor();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const breath = ctx.createGain();
  breath.gain.value = 1 - BREATH_DEPTH;
  breath.connect(master);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = BREATH_HZ;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = BREATH_DEPTH;
  lfo.connect(lfoDepth).connect(breath.gain);
  lfo.start();

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.connect(breath);

  const addVoice = (ratio: number, offsetHz: number, level: number): ToneVoice => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = level;
    osc.connect(voiceGain).connect(filter);
    osc.start();
    return { osc, ratio, offsetHz };
  };
  const voices = [addVoice(1, 0, 0.5), addVoice(1, VOICE_DETUNE_HZ, 0.5), addVoice(0.5, 0, SUB_OCTAVE_LEVEL)];

  return { ctx, master, filter, voices, fresh: true };
}

function applyFrequency(graph: ToneGraph, frequencyHz: number) {
  const now = graph.ctx.currentTime;
  const set = (param: AudioParam, value: number) => {
    param.cancelScheduledValues(now);
    if (graph.fresh) param.setValueAtTime(value, now);
    else param.setTargetAtTime(value, now, GLIDE_SECONDS / 3);
  };
  for (const voice of graph.voices) set(voice.osc.frequency, frequencyHz * voice.ratio + voice.offsetHz);
  set(graph.filter.frequency, frequencyHz * FILTER_RATIO);
  graph.fresh = false;
}

/**
 * Plays a soft tone at `frequencyHz` while `audible` is true, fading in and
 * out rather than cutting, and gliding when the frequency changes. Pass
 * `null` to disable the layer entirely.
 */
export function useToneLayer(frequencyHz: number | null, audible: boolean) {
  const graphRef = useRef<ToneGraph | null>(null);
  const enabled = frequencyHz !== null;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const graph = buildGraph();
    graphRef.current = graph;
    return () => {
      graphRef.current = null;
      void graph?.ctx.close();
    };
  }, [enabled]);

  useEffect(() => {
    const graph = graphRef.current;
    if (graph && frequencyHz !== null) applyFrequency(graph, frequencyHz);
  }, [enabled, frequencyHz]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const { ctx, master } = graph;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    if (audible) {
      void ctx.resume();
      master.gain.linearRampToValueAtTime(PEAK_GAIN, now + FADE_IN_SECONDS);
    } else {
      master.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
    }
  }, [audible, enabled]);
}

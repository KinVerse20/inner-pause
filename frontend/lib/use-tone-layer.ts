"use client";

import { useEffect, useRef } from "react";

// A generated frequency layer for the Pause Player (docs/PRODUCT_FLOW.md §8's
// "frequency / tonal layer"): a soft tone at the Pause's own frequency,
// played only when the Pause has no sound of its own. A Pause with a sound
// is tuned to the frequency instead (lib/use-tuned-sound.ts). Built
// with the Web Audio API so any frequency can be produced without a
// separate recorded file per frequency. One tone at a time: a Pause with
// several centres crossfades from one to the next.

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

// Two identical banks of voices: the one sounding, and the one a new
// frequency fades in on, so a Pause moving to its next centre crossfades
// from one tone to the other instead of sliding in pitch.
interface ToneBank {
  gain: GainNode;
  filter: BiquadFilterNode;
  voices: ToneVoice[];
}

interface ToneGraph {
  ctx: AudioContext;
  master: GainNode;
  banks: [ToneBank, ToneBank];
  active: 0 | 1;
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

  const buildBank = (level: number): ToneBank => {
    const gain = ctx.createGain();
    gain.gain.value = level;
    gain.connect(breath);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.connect(gain);
    const addVoice = (ratio: number, offsetHz: number, voiceLevel: number): ToneVoice => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = voiceLevel;
      osc.connect(voiceGain).connect(filter);
      osc.start();
      return { osc, ratio, offsetHz };
    };
    return { gain, filter, voices: [addVoice(1, 0, 0.5), addVoice(1, VOICE_DETUNE_HZ, 0.5), addVoice(0.5, 0, SUB_OCTAVE_LEVEL)] };
  };

  return { ctx, master, banks: [buildBank(1), buildBank(0)], active: 0, fresh: true };
}

function tuneBank(bank: ToneBank, frequencyHz: number, at: (param: AudioParam, value: number) => void) {
  for (const voice of bank.voices) at(voice.osc.frequency, frequencyHz * voice.ratio + voice.offsetHz);
  at(bank.filter.frequency, frequencyHz * FILTER_RATIO);
}

function applyFrequency(graph: ToneGraph, frequencyHz: number, crossfadeSeconds: number) {
  const now = graph.ctx.currentTime;
  const instant = (param: AudioParam, value: number) => {
    param.cancelScheduledValues(now);
    param.setValueAtTime(value, now);
  };
  const glide = (param: AudioParam, value: number) => {
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, GLIDE_SECONDS / 3);
  };
  if (graph.fresh || crossfadeSeconds <= 0) {
    tuneBank(graph.banks[graph.active], frequencyHz, graph.fresh ? instant : glide);
    graph.fresh = false;
    return;
  }
  // The new tone rises on the quiet bank while the old one falls away.
  const from = graph.banks[graph.active];
  const nextIndex = graph.active === 0 ? 1 : 0;
  const to = graph.banks[nextIndex];
  tuneBank(to, frequencyHz, instant);
  for (const [bank, target] of [[from, 0], [to, 1]] as const) {
    bank.gain.gain.cancelScheduledValues(now);
    bank.gain.gain.setValueAtTime(bank.gain.gain.value, now);
    bank.gain.gain.linearRampToValueAtTime(target, now + crossfadeSeconds);
  }
  graph.active = nextIndex;
}

/**
 * Plays a soft tone at `frequencyHz` while `audible` is true, fading in and
 * out rather than cutting, and gliding when the frequency changes. Pass
 * `null` to disable the layer entirely.
 */
export function useToneLayer(frequencyHz: number | null, audible: boolean, level: number = PEAK_GAIN, crossfadeSeconds = 0) {
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
    if (graph && frequencyHz !== null) applyFrequency(graph, frequencyHz, crossfadeSeconds);
    // A new crossfade length alone doesn't retune.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      master.gain.linearRampToValueAtTime(level, now + FADE_IN_SECONDS);
    } else {
      master.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECONDS);
    }
  }, [audible, enabled, level]);
}

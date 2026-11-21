import { CATALOG_VERSION, confirmEmotions, frequencies, type Chakra } from './emotion-catalog.ts';

export const soundExperiences = ['rain', 'forest', 'waves', 'wind', 'binaural-focus', 'bilateral-calm', 'mindspace', 'frequency-only'] as const;
export type SoundExperience = typeof soundExperiences[number];
// Product-approved undertone gain levels, auditioned against the normalized ambience masters.
export const tonePresets = { soft: -48, balanced: -45, clear: -39 } as const;
export type TonePreset = keyof typeof tonePresets;
export type PlanDepth = 'quick' | 'complete' | 'deep';
export interface SessionInput {
  emotionIds: string[];
  inputMode: 'written' | 'direct';
  reflection?: string;
  depth: PlanDepth;
  minutesPerFrequency?: 5 | 10 | 15;
  sound: SoundExperience;
  tonePreset: TonePreset;
}
export interface SessionPlan {
  catalogVersion: string;
  selection: SessionInput;
  blocks: { chakra: Chakra; frequencyHz: number; emotionIds: string[]; durationSeconds: number }[];
  totalSeconds: number;
}
export function createSessionPlan(input: SessionInput): SessionPlan {
  if (!input || !['written', 'direct'].includes(input.inputMode)) throw new Error('Choose written or direct input.');
  if (input.inputMode === 'written' && (typeof input.reflection !== 'string' || !input.reflection.trim() || input.reflection.length > 10000)) throw new Error('Written input requires a reflection of at most 10,000 characters.');
  if (!['quick', 'complete', 'deep'].includes(input.depth)) throw new Error('Invalid plan depth.');
  if (!soundExperiences.includes(input.sound)) throw new Error('Invalid sound.');
  if (!Object.hasOwn(tonePresets, input.tonePreset)) throw new Error('Invalid tone preset.');
  const minutes = input.minutesPerFrequency ?? { quick: 5, complete: 10, deep: 15 }[input.depth];
  if (![5, 10, 15].includes(minutes)) throw new Error('Choose 5, 10 or 15 minutes per frequency.');
  const confirmed = confirmEmotions(input.emotionIds);
  const blocks = (Object.keys(frequencies) as Chakra[]).flatMap(chakra => {
    const emotionIds = confirmed.filter(e => e.chakra === chakra).map(e => e.id);
    return emotionIds.length ? [{ chakra, frequencyHz: frequencies[chakra], emotionIds, durationSeconds: minutes * 60 }] : [];
  });
  return {
    catalogVersion: CATALOG_VERSION,
    selection: {
      emotionIds: [...input.emotionIds], inputMode: input.inputMode,
      ...(input.inputMode === 'written' ? { reflection: input.reflection!.trim() } : {}),
      depth: input.depth, sound: input.sound, tonePreset: input.tonePreset,
      minutesPerFrequency: minutes as 5 | 10 | 15,
    },
    blocks,
    totalSeconds: blocks.reduce((sum, block) => sum + block.durationSeconds, 0),
  };
}

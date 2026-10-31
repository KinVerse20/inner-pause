import type { CardChakraId } from "./cards";

// How a Pause's sound is tuned to its frequency. Shared so the live tuning
// in the browser (frontend/lib/use-tuned-sound.ts) and the files the server
// renders (backend/src/renderer.ts) sound the same.

// Resonance at the frequency and at its octave: peak gain (dB) and Q (how
// narrow the band is). Kept subtle on purpose: over a ten-minute Pause the
// frequency should be felt more than heard, and the sound stay itself.
export const RESONANCES = [
  { ratio: 1, gainDb: 10, q: 18 },
  { ratio: 2, gainDb: 5, q: 18 },
] as const;

// A ring toward 1 kHz and above sounds sharper (and the ear is more
// sensitive there) than one at 174 or 396 Hz, so the resonance eases off
// above BRIGHT_FROM_HZ, down to BRIGHT_MIN_SCALE of its strength by 1 kHz.
const BRIGHT_FROM_HZ = 500;
const BRIGHT_MIN_SCALE = 0.6;

/** The resonance gain actually applied at `hz`. */
export function resonanceGainDb(gainDb: number, hz: number) {
  if (hz <= BRIGHT_FROM_HZ) return gainDb;
  const scale = Math.max(BRIGHT_MIN_SCALE, 1 - ((hz - BRIGHT_FROM_HZ) / (1000 - BRIGHT_FROM_HZ)) * (1 - BRIGHT_MIN_SCALE));
  return gainDb * scale;
}

/**
 * Each chakra's traditional frequency — the frequency a card plays unless
 * an admin set its own. Must match the labels in frontend/data/chakras.ts.
 */
export const CHAKRA_FREQUENCY_HZ: Record<CardChakraId, number> = {
  root: 396,
  sacral: 417,
  "solar-plexus": 528,
  heart: 639,
  throat: 741,
  "third-eye": 852,
  crown: 963,
};

/** The frequency a card's Pauses play: its own, or its chakra's. */
export function cardFrequencyHz(card: { frequencyHz: number | null; chakraId: CardChakraId }) {
  return card.frequencyHz ?? CHAKRA_FREQUENCY_HZ[card.chakraId];
}

/** Every rendered sound is levelled to this loudness (EBU R128, LUFS). */
export const TARGET_LOUDNESS_LUFS = -20;

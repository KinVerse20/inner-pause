// Built-in sound library — Kinverse's sound experiences
// (lib/phase-one-data.ts + lib/revised-audio.ts on
// feature/practice-guided-breathing-mindspace), files under
// public/audio/sounds/. A Pause plays one of these when its card has no
// admin-uploaded sound; the frequency is then layered underneath as a soft
// undertone at the chosen strength (Soft / Balanced / Clear).

export type BuiltInSoundId =
  | "rain"
  | "rainforest"
  | "waves"
  | "wind"
  | "deep-ambient"
  | "binaural-focus"
  | "mindspace"
  | "bilateral-calm"
  | "tuned-piano"
  | "frequency-only";

export type SoundGroup = "nature" | "headphones" | "tuned" | "frequency";

export interface BuiltInSound {
  id: BuiltInSoundId;
  group: SoundGroup;
  label: string;
  copy: string;
  /** Stereo effects that only work on headphones. */
  headphoneOnly?: boolean;
  /** Null for the sounds made in the app (Frequency only, Binaural) and for tuned recordings (see tunedFile). */
  url: string | null;
  /**
   * Kinverse's healing-player mixes, recorded at each chakra frequency
   * (public/audio/chakras/<hz>/<file>_<hz>Hz.mp3). The frequency is already
   * in the recording, so no undertone is layered on top. Offered only when
   * the Pause's frequency is one of RECORDED_FREQUENCIES exactly.
   */
  tunedFile?: "piano" | "ambient";
  /**
   * Made in the app at the Pause's own frequency (lib/use-tone-layer.ts):
   * "tone" is the frequency on its own, "binaural" puts it in the left ear
   * and a few hertz above it in the right.
   */
  generated?: "tone" | "binaural";
}

/** The frequencies the tuned recordings exist at (public/audio/chakras/<hz>/). */
export const RECORDED_FREQUENCIES = [396, 417, 528, 639, 741, 852, 963];

/** Whether a recording tuned to exactly `frequencyHz` exists. */
export function hasTunedRecording(frequencyHz: number | null) {
  return frequencyHz !== null && RECORDED_FREQUENCIES.includes(frequencyHz);
}

/**
 * The file to play for a sound in a Pause at `frequencyHz`. A tuned
 * recording plays only at its own frequency, never a near one, so what the
 * player says is what you hear; null when there's none (or the sound is
 * made in the app).
 */
export function soundUrlFor(sound: BuiltInSound | undefined, frequencyHz: number | null): string | null {
  if (!sound) return null;
  if (!sound.tunedFile) return sound.url;
  if (frequencyHz === null || !hasTunedRecording(frequencyHz)) return null;
  return `/audio/chakras/${frequencyHz}/${sound.tunedFile}_${frequencyHz}Hz.mp3`;
}

/**
 * Whether a sound can play in a Pause at `frequencyHz` (or with several
 * centres): a tuned recording needs one recording at its one frequency.
 */
export function soundFits(sound: BuiltInSound, frequencyHz: number | null, severalFrequencies: boolean) {
  if (!sound.tunedFile) return true;
  return !severalFrequencies && hasTunedRecording(frequencyHz);
}

// Every sound carries only the Pause's frequency: the Deep ambient and
// Mindspace files had a 174 Hz drone of their own, taken out (27 Nov).
export const BUILT_IN_SOUNDS: BuiltInSound[] = [
  { id: "rain", group: "nature", label: "Rain", copy: "A steady, familiar wash of rain", url: "/audio/sounds/rain.m4a" },
  { id: "rainforest", group: "nature", label: "Rainforest", copy: "Warm rain falling through a living forest", url: "/audio/sounds/rainforest.m4a" },
  { id: "waves", group: "nature", label: "Ocean waves", copy: "Slow water movement and open space", url: "/audio/sounds/waves.m4a" },
  { id: "wind", group: "nature", label: "Gentle wind", copy: "Soft moving air without musical notes", url: "/audio/sounds/wind.m4a" },
  { id: "deep-ambient", group: "tuned", label: "Deep ambient", copy: "A deep, enveloping ambience tuned to this Pause", url: null, tunedFile: "ambient" },
  { id: "binaural-focus", group: "headphones", label: "Binaural", copy: "This Pause's frequency in one ear, a few hertz above it in the other", headphoneOnly: true, url: null, generated: "binaural" },
  { id: "mindspace", group: "headphones", label: "Mindspace", copy: "A calm ambience that moves gently between your ears", headphoneOnly: true, url: "/audio/sounds/mindspace.m4a" },
  { id: "bilateral-calm", group: "headphones", label: "Bilateral calm", copy: "A gentle stereo pattern", headphoneOnly: true, url: "/audio/sounds/bilateral-calm.m4a" },
  { id: "tuned-piano", group: "tuned", label: "Piano, tuned", copy: "Piano played around this Pause's frequency", url: null, tunedFile: "piano" },
  { id: "frequency-only", group: "frequency", label: "Frequency only", copy: "The frequency on its own, no ambience", url: null, generated: "tone" },
];

export const DEFAULT_BUILT_IN_SOUND: BuiltInSoundId = "rain";

/**
 * The sound that actually plays for a choice: a tuned recording that has no
 * file at this Pause's frequency (or a Pause with several centres) plays
 * Rain instead, with the frequency beneath it, rather than a near frequency.
 */
export function playableSound(id: string | null | undefined, frequencyHz: number | null, severalFrequencies: boolean): BuiltInSound {
  const chosen = findBuiltInSound(id) ?? findBuiltInSound(DEFAULT_BUILT_IN_SOUND)!;
  return soundFits(chosen, frequencyHz, severalFrequencies) ? chosen : findBuiltInSound(DEFAULT_BUILT_IN_SOUND)!;
}

// Sounds taken out of the library (27 Nov), and what plays in their place
// for a Pause, a Practice day or a preference that still names them.
const RETIRED: Record<string, BuiltInSoundId> = {
  forest: "rainforest",
  "tuned-forest": "rainforest",
  "tuned-rain": "rain",
  piano: "tuned-piano",
  bell: "rain",
  gong: "rain",
};

export function findBuiltInSound(id: string | null | undefined): BuiltInSound | undefined {
  if (!id) return undefined;
  const current = RETIRED[id] ?? id;
  return BUILT_IN_SOUNDS.find((sound) => sound.id === current);
}

export type UndertoneLevel = "soft" | "balanced" | "clear";

/** Kinverse's levels were -48 / -45 / -39 dB under the ambience. */
export const UNDERTONE_LEVELS: Array<{ id: UndertoneLevel; label: string; gain: number }> = [
  { id: "soft", label: "Soft", gain: 0.02 },
  { id: "balanced", label: "Balanced", gain: 0.032 },
  { id: "clear", label: "Clear", gain: 0.06 },
];

export function undertoneGain(level: UndertoneLevel) {
  return UNDERTONE_LEVELS.find((item) => item.id === level)?.gain ?? 0.032;
}

/**
 * How loud a sound made in the app (Frequency only, Binaural) plays at
 * Soft, Balanced and Clear: here the frequency is all you hear, so the
 * levels sit well above the undertone's.
 */
const GENERATED_GAIN: Record<UndertoneLevel, number> = { soft: 0.03, balanced: 0.05, clear: 0.08 };

export function generatedGain(level: UndertoneLevel) {
  return GENERATED_GAIN[level] ?? GENERATED_GAIN.balanced;
}

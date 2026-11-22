// Built-in sound library — Kinverse's sound experiences
// (lib/phase-one-data.ts + lib/revised-audio.ts on
// feature/practice-guided-breathing-mindspace), files under
// public/audio/sounds/. A Pause plays one of these when its card has no
// admin-uploaded sound; the frequency is then layered underneath as a soft
// undertone at the chosen strength (Soft / Balanced / Clear).

export type BuiltInSoundId =
  | "rain"
  | "forest"
  | "rainforest"
  | "waves"
  | "wind"
  | "piano"
  | "bell"
  | "gong"
  | "mindspace"
  | "binaural-focus"
  | "bilateral-calm"
  | "frequency-only";

export type SoundGroup = "nature" | "music" | "headphones" | "frequency";

export const SOUND_GROUPS: Array<{ id: SoundGroup; label: string }> = [
  { id: "nature", label: "Nature" },
  { id: "music", label: "Music and resonance" },
  { id: "headphones", label: "With headphones" },
  { id: "frequency", label: "Just the frequency" },
];

export interface BuiltInSound {
  id: BuiltInSoundId;
  group: SoundGroup;
  label: string;
  copy: string;
  /** Stereo effects that only work on headphones. */
  headphoneOnly?: boolean;
  /** Null for "Frequency only": the undertone with no ambience. */
  url: string | null;
}

export const BUILT_IN_SOUNDS: BuiltInSound[] = [
  { id: "rain", group: "nature", label: "Rain", copy: "A steady, familiar wash of rain", url: "/audio/sounds/rain.m4a" },
  { id: "forest", group: "nature", label: "Forest", copy: "Leaves, birds and a quiet natural space", url: "/audio/sounds/forest.m4a" },
  { id: "rainforest", group: "nature", label: "Rainforest", copy: "Warm rain falling through a living forest", url: "/audio/sounds/rainforest.m4a" },
  { id: "waves", group: "nature", label: "Ocean waves", copy: "Slow water movement and open space", url: "/audio/sounds/waves.m4a" },
  { id: "wind", group: "nature", label: "Gentle wind", copy: "Soft moving air without musical notes", url: "/audio/sounds/wind.m4a" },
  { id: "piano", group: "music", label: "Piano", copy: "Slow, quiet piano with plenty of space", url: "/audio/sounds/piano.m4a" },
  { id: "bell", group: "music", label: "Bell", copy: "A soft bell that rings and fades", url: "/audio/sounds/bell.m4a" },
  { id: "gong", group: "music", label: "Gong", copy: "Deep, slow gong resonance", url: "/audio/sounds/gong.m4a" },
  { id: "mindspace", group: "headphones", label: "Mindspace", copy: "A calm ambience that moves gently between your ears", headphoneOnly: true, url: "/audio/sounds/mindspace.m4a" },
  { id: "binaural-focus", group: "headphones", label: "Binaural focus", copy: "A different tone in each ear", headphoneOnly: true, url: "/audio/sounds/binaural-focus.m4a" },
  { id: "bilateral-calm", group: "headphones", label: "Bilateral calm", copy: "A gentle stereo pattern", headphoneOnly: true, url: "/audio/sounds/bilateral-calm.m4a" },
  { id: "frequency-only", group: "frequency", label: "Frequency only", copy: "The undertone on its own, no ambience", url: null },
];

export const DEFAULT_BUILT_IN_SOUND: BuiltInSoundId = "rain";

export function findBuiltInSound(id: string | null | undefined): BuiltInSound | undefined {
  return BUILT_IN_SOUNDS.find((sound) => sound.id === id);
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

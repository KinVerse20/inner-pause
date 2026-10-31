import { z } from "zod";

import { PAUSE_CATEGORY_IDS, type PauseCategoryId } from "./pause-categories";

// Home's Right Now cards, as admin-managed records (/admin → Cards). The
// six original cards are seeded into the database on first read and stay
// editable; admins can add their own. The originals can be hidden but not
// deleted: Tell routing, Moments situations and Practice sessions refer to
// them by id (PAUSE_CATEGORY_IDS), so they must always exist.

export const CHAKRA_IDS = ["root", "sacral", "solar-plexus", "heart", "throat", "third-eye", "crown"] as const;
export type CardChakraId = (typeof CHAKRA_IDS)[number];

/** Icon glyphs a card can use (components/pause-icons.tsx). */
export const CARD_ICONS = ["moon", "reset", "focus", "spark", "wave", "feather", "sun", "bubbles", "signpost", "briefcase"] as const;
export type CardIcon = (typeof CARD_ICONS)[number];

/** Accent colour families — the six outcome tints in app/globals.css (--ds-outcome-*). */
export const CARD_TONES = PAUSE_CATEGORY_IDS;
export type CardTone = PauseCategoryId;

export const MAX_CARDS = 24;
export const MAX_SOUNDS_PER_CARD = 12;

/** The span a card's custom frequency may take: audible, and well past the traditional 174–963 Hz set. */
export const MIN_FREQUENCY_HZ = 20;
export const MAX_FREQUENCY_HZ = 2000;

/** "432 Hz", "7.83 Hz" — the same shape as the chakra frequency labels. */
export function formatFrequencyLabel(hz: number) {
  return `${Number(hz.toFixed(2))} Hz`;
}

export const cardSoundSchema = z.object({
  soundId: z.string().min(1),
  volume: z.number().min(0).max(1),
});

/** Everything an admin can edit on a card (the id is fixed at creation). */
export const cardInputSchema = z.object({
  label: z.string().trim().min(1).max(30),
  /** Small line under the label on the Home tile, e.g. "Rest deeply". */
  subtitle: z.string().trim().max(40),
  /** The card's intent, shown on its own screen and in "Why this Pause?". */
  tagline: z.string().trim().min(1).max(80),
  /** Picks the chakra (and, unless overridden below, the frequency). */
  chakraId: z.enum(CHAKRA_IDS),
  /**
   * The frequency (Hz) the card's sounds are tuned to (or of the soft tone
   * played when it has none), replacing the chakra's traditional frequency.
   * `null` keeps the chakra's.
   */
  frequencyHz: z.number().min(MIN_FREQUENCY_HZ).max(MAX_FREQUENCY_HZ).nullable().default(null),
  icon: z.enum(CARD_ICONS),
  tone: z.enum(CARD_TONES),
  hidden: z.boolean(),
  /**
   * Optional lines shown during playback, in order. Empty uses the card's
   * built-in guidance (original six) or a gentle generic set (new cards).
   */
  guidanceLines: z.array(z.string().trim().min(1).max(120)).max(4),
  /** Sound environments offered on the card's screen; the first is its default. */
  sounds: z
    .array(cardSoundSchema)
    .max(MAX_SOUNDS_PER_CARD)
    .refine((list) => new Set(list.map((item) => item.soundId)).size === list.length, {
      message: "A sound can only be added to a card once.",
    }),
});

export const cardSchema = cardInputSchema.extend({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  builtIn: z.boolean(),
});

/** A full reordering of Home's cards: every card id, exactly once. */
export const cardOrderSchema = z.object({ ids: z.array(z.string()).max(MAX_CARDS) });

export type CardSound = z.infer<typeof cardSoundSchema>;
export type CardInput = z.infer<typeof cardInputSchema>;
export type CardDefinition = z.infer<typeof cardSchema>;

/** The six original cards, exactly as the app shipped them. */
export const DEFAULT_CARDS: CardDefinition[] = [
  { id: "sleep", label: "Sleep", subtitle: "Rest deeply", tagline: "Quiet down for rest", chakraId: "crown", icon: "moon", tone: "sleep" },
  { id: "reset", label: "Reset", subtitle: "Start fresh", tagline: "Ground and restart", chakraId: "root", icon: "reset", tone: "reset" },
  { id: "focus", label: "Focus", subtitle: "Find your flow", tagline: "Clear distractions", chakraId: "third-eye", icon: "focus", tone: "focus" },
  { id: "confidence", label: "Confidence", subtitle: "Feel more capable", tagline: "Build inner strength", chakraId: "solar-plexus", icon: "spark", tone: "confidence" },
  { id: "calm", label: "Calm", subtitle: "Feel more at ease", tagline: "Slow down and settle", chakraId: "heart", icon: "wave", tone: "calm" },
  { id: "release", label: "Release", subtitle: "Let it go", tagline: "Let go of what you're holding", chakraId: "sacral", icon: "feather", tone: "release" },
].map((card) => ({ ...card, builtIn: true, hidden: false, frequencyHz: null, guidanceLines: [], sounds: [] }) as CardDefinition);

export function isBuiltInCardId(id: string): id is PauseCategoryId {
  return (PAUSE_CATEGORY_IDS as readonly string[]).includes(id);
}

/** A url-safe id for a new card, unique against `taken`. */
export function cardIdFromLabel(label: string, taken: Iterable<string>) {
  const used = new Set(taken);
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "card";
  let candidate = base;
  for (let n = 2; used.has(candidate); n += 1) candidate = `${base}-${n}`;
  return candidate;
}

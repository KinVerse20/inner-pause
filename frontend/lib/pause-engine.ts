import { formatFrequencyLabel, isBuiltInCardId, type PublicCard } from "@inner-pause/shared";

import { chakraMap } from "@/data/chakras";
import { getCard, getCardSound } from "@/lib/content-store";
import type { PauseCategoryId } from "@/lib/pause-categories";
import {
  GENERIC_GUIDANCE_LINES,
  buildGroundPlaybackCues,
  buildGuidanceLinePlaybackCues,
  buildThemePlaybackCues,
  type PlaybackCue,
} from "@/lib/session-content";
import type { ChakraId } from "@/lib/types";

// The single Pause-composition seam for this vertical slice
// (docs/TECHNICAL_ARCHITECTURE.md §5 "Compose" step). Right Now, the
// center Pause action ("Ground Pause"), Big Moments (Before/During/After —
// lib/big-moment-engine.ts), and Practice (lib/practice-engine.ts) all
// compose by calling composeRightNowPause below and overriding
// type-specific fields — one PauseDefinition shape, one audio/session
// engine, never a second one.
//
// Sound framework fields (docs/PRODUCT_FLOW.md §8): practice intent
// (`intentLabel`), chakra/traditional association (`chakraId` /
// `traditionalAssociation`), frequency/tonal layer (`frequencyLabel`),
// sound environment (`soundEnvironmentLabel`). Only one audio track exists
// per chakra today (public/audio/*.mp3) — these are temporary/placeholder
// tracks, not final licensed production audio; `audioPath` is the one
// swappable seam that changes when real content lands, nothing else here
// needs to.
export type PauseType = "right-now" | "center-pause" | "big-moment" | "practice";

export interface PauseDefinition {
  pauseType: PauseType;
  outcomeId?: PauseCategoryId;
  title: string;
  intentLabel: string;
  chakraId: ChakraId;
  chakraName: string;
  traditionalAssociation: string;
  frequencyLabel: string;
  soundEnvironmentLabel: string;
  audioPath: string;
  durationSeconds: number;
  /** docs/PRODUCT_FLOW.md §7: Arrive is deterministic by Pause type, never a dynamic formula. */
  requiresArrive: boolean;
  /**
   * Shown only before playback (the Arrive screen, or the Ground Pause's own
   * brief "Get comfortable" transition) — never during playback, and never
   * the same content as `playbackCues` (docs/PRODUCT_FLOW.md §7).
   */
  arrivalGuidance: string[];
  /**
   * Shown only during playback — the shared session-aware content layer
   * (lib/session-content.ts, docs/PRODUCT_FLOW.md §7): sparse, pre-authored,
   * deterministic, cycled through at a small number of fixed points over the
   * session. Never the arrival copy carried forward, never live-generated.
   */
  playbackCues: PlaybackCue[];
  /**
   * Where a "Better"/Skip check-in outcome should return to, instead of the
   * default Home — used by flows that need to resume after the Pause
   * (Practice's Activity step, lib/practice-engine.ts). Undefined for every
   * other Pause type, which keeps their existing Home-bound behaviour
   * exactly as it was (components/pause-player-screen.tsx).
   */
  returnTo?: string;
  /**
   * An admin-chosen sound environment (rain, river…) layered beneath the
   * track (lib/content-store.ts, /admin → Cards). Undefined when the card
   * has none — the Pause then plays exactly as before.
   */
  ambientSoundUrl?: string;
  /** The server's renderings of it (tuned to this Pause, and plain), once ready. */
  ambientTunedUrl?: string;
  ambientPlainUrl?: string;
  /** Loudness correction (dB) that levels the original live. */
  ambientGainDb?: number;
  /** 0–1 volume for the ambient layer. */
  ambientVolume?: number;
  /** The Home card this Pause was composed from, built-in or admin-created. */
  cardId?: string;
}

// docs/PRODUCT_FLOW.md §7: Right Now = 10 minutes, uses Arrive by default.
const RIGHT_NOW_DURATION_SECONDS = 10 * 60;

// docs/PRODUCT_FLOW.md §7: full Arrive — two lines, then an explicit
// "I'm ready" (rendered by the player, not part of this copy).
const RIGHT_NOW_ARRIVAL_GUIDANCE = ["Get comfortable.", "Let your body settle. Nothing else to do."];

// docs/PRODUCT_FLOW.md §7: the Ground Pause — ~3 minutes, always skips
// Arrive (its own brief "Get comfortable" transition replaces it).
// Mapped to the root chakra (grounding, safety, belonging — data/chakras.ts)
// since that's the closest existing traditional association to "grounding
// / settling" without inventing new chakra content; this is a distinct
// composition from the "Reset" Right Now outcome (different title,
// duration, and entry point) and is never the "Calm" outcome.
const GROUND_CHAKRA_ID: ChakraId = "root";
const GROUND_DURATION_SECONDS = 3 * 60;

// docs/PRODUCT_FLOW.md §7: the Ground Pause's transition is a single fixed
// line, deliberately distinct from full Arrive's two lines + "I'm ready" —
// it always auto-advances, never asks for confirmation.
const GROUND_ARRIVAL_GUIDANCE = ["Get comfortable. This will only take a few minutes."];

// Composes a Right Now Pause from any Home card (lib/content-store.ts) —
// one of the original six or an admin-created one. The card's chakra picks
// the track and frequency; its guidance lines (if any) replace the
// built-in playback cues. `ambientSoundId` is the sound the user picked on
// the card's screen (components/category-sounds-screen.tsx); omitted means
// the card's default sound, `null` means none.
export function composeCardPause(card: PublicCard, options: { ambientSoundId?: string | null } = {}): PauseDefinition {
  const chakra = chakraMap[card.chakraId];
  const ambient = getCardSound(card.id, options.ambientSoundId);
  // An admin-set frequency replaces the chakra's everywhere it's named
  // (playback cue, "Why this Pause?") and is what the sound is tuned to
  // (lib/use-tuned-sound.ts), or the tone plays when there's no sound
  // (lib/use-tone-layer.ts). Both read the Hz straight from this label.
  const frequencyLabel = card.frequencyHz ? formatFrequencyLabel(card.frequencyHz) : chakra.frequencyLabel;
  const playbackCues =
    card.guidanceLines.length > 0
      ? buildGuidanceLinePlaybackCues(card.guidanceLines, chakra.name, frequencyLabel)
      : isBuiltInCardId(card.id)
        ? buildThemePlaybackCues(card.id, chakra.name, frequencyLabel)
        : buildGuidanceLinePlaybackCues(GENERIC_GUIDANCE_LINES, chakra.name, frequencyLabel);
  return {
    ambientSoundUrl: ambient?.url,
    ambientTunedUrl: ambient?.tunedUrl ?? undefined,
    ambientPlainUrl: ambient?.plainUrl ?? undefined,
    ambientGainDb: ambient?.gainDb,
    ambientVolume: ambient?.volume,
    pauseType: "right-now",
    outcomeId: isBuiltInCardId(card.id) ? card.id : undefined,
    cardId: card.id,
    title: `${card.label} Pause`,
    intentLabel: card.tagline,
    chakraId: card.chakraId,
    chakraName: chakra.name,
    traditionalAssociation: chakra.meaning,
    frequencyLabel,
    soundEnvironmentLabel: "Ambient tones",
    audioPath: chakra.audioPath,
    durationSeconds: RIGHT_NOW_DURATION_SECONDS,
    requiresArrive: true,
    arrivalGuidance: RIGHT_NOW_ARRIVAL_GUIDANCE,
    playbackCues,
  };
}

// The original six outcomes, as Tell, Moments and Practice refer to them.
// Always resolves (lib/content-store.ts falls back to the shipped card),
// and reflects any admin edits to that card.
export function composeRightNowPause(
  outcomeId: PauseCategoryId,
  options: { ambientSoundId?: string | null } = {},
): PauseDefinition {
  const card = getCard(outcomeId);
  if (!card) throw new Error(`Unknown Right Now outcome: ${outcomeId}`);
  return composeCardPause(card, options);
}

export function composeGroundPause(): PauseDefinition {
  const chakra = chakraMap[GROUND_CHAKRA_ID];
  return {
    pauseType: "center-pause",
    title: "Ground Pause",
    intentLabel: "Grounding and settling",
    chakraId: GROUND_CHAKRA_ID,
    chakraName: chakra.name,
    traditionalAssociation: chakra.meaning,
    frequencyLabel: chakra.frequencyLabel,
    soundEnvironmentLabel: "Ambient tones",
    audioPath: chakra.audioPath,
    durationSeconds: GROUND_DURATION_SECONDS,
    requiresArrive: false,
    arrivalGuidance: GROUND_ARRIVAL_GUIDANCE,
    playbackCues: buildGroundPlaybackCues(new Date().getDate()),
  };
}

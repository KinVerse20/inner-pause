import { chakraMap } from "@/data/chakras";
import { pauseCategories, type PauseCategoryId } from "@/lib/pause-categories";
import { buildGroundPlaybackCues, buildThemePlaybackCues, type PlaybackCue } from "@/lib/session-content";
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

export function composeRightNowPause(outcomeId: PauseCategoryId): PauseDefinition {
  const category = pauseCategories.find((item) => item.id === outcomeId);
  if (!category) throw new Error(`Unknown Right Now outcome: ${outcomeId}`);
  const chakra = chakraMap[category.chakraId];
  return {
    pauseType: "right-now",
    outcomeId: category.id,
    title: `${category.label} Pause`,
    intentLabel: category.tagline,
    chakraId: category.chakraId,
    chakraName: chakra.name,
    traditionalAssociation: chakra.meaning,
    frequencyLabel: chakra.frequencyLabel,
    soundEnvironmentLabel: "Ambient tones",
    audioPath: chakra.audioPath,
    durationSeconds: RIGHT_NOW_DURATION_SECONDS,
    requiresArrive: true,
    arrivalGuidance: RIGHT_NOW_ARRIVAL_GUIDANCE,
    playbackCues: buildThemePlaybackCues(category.id, chakra.name, chakra.frequencyLabel),
  };
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

import { composeRightNowPause, type PauseDefinition } from "@/lib/pause-engine";
import type { PauseCategoryId } from "@/lib/pause-categories";
import { buildBigMomentPlaybackCues } from "@/lib/session-content";

// Big Moments compose by reusing composeRightNowPause's chakra/frequency/
// audio selection for a category — the actual sound framework mapping is
// never re-invented here (docs/TECHNICAL_ARCHITECTURE.md §5's "reusing this
// same PauseDefinition shape") — and overriding only the mode-specific
// fields (title, duration, Arrive rule) per docs/PRODUCT_FLOW.md §12-§14.
export type BigMomentMode = "before" | "during" | "after";

export interface SituationOption {
  id: string;
  label: string;
  categoryId: PauseCategoryId;
}

// Compact, mode-specific situation sets — deliberately not the full Right
// Now/Tell category catalogue (docs/PRODUCT_FLOW.md §11: "compact set of
// relevant situation choices... immediately understandable"). Category
// mapping is a reasonable deterministic default per situation, not a new
// sound-framework decision — every id still resolves through the existing
// six Right Now categories.
const SITUATIONS: Record<BigMomentMode, SituationOption[]> = {
  before: [
    { id: "interview", label: "Interview", categoryId: "confidence" },
    { id: "presentation", label: "Presentation", categoryId: "confidence" },
    { id: "difficult-conversation", label: "Difficult conversation", categoryId: "calm" },
    { id: "big-decision", label: "Big decision", categoryId: "focus" },
    { id: "something-else", label: "Something else", categoryId: "confidence" },
  ],
  during: [
    { id: "important-meeting", label: "Important meeting", categoryId: "focus" },
    { id: "difficult-conversation", label: "Difficult conversation", categoryId: "calm" },
    { id: "feeling-overwhelmed", label: "Feeling overwhelmed", categoryId: "reset" },
    { id: "waiting-for-something", label: "Waiting for something", categoryId: "calm" },
    { id: "something-else", label: "Something else", categoryId: "calm" },
  ],
  after: [
    { id: "argument", label: "Argument", categoryId: "release" },
    { id: "result-rejection", label: "Result / rejection", categoryId: "release" },
    { id: "something-went-wrong", label: "Something went wrong", categoryId: "reset" },
    { id: "difficult-conversation", label: "Difficult conversation", categoryId: "release" },
    { id: "something-else", label: "Something else", categoryId: "release" },
  ],
};

// Fallback category when no situation is selected at all (Skip) — still a
// deterministic default per mode, never AI-chosen (docs/PRODUCT_FLOW.md §7).
const DEFAULT_CATEGORY: Record<BigMomentMode, PauseCategoryId> = {
  before: "confidence",
  during: "calm",
  after: "release",
};

// docs/PRODUCT_FLOW.md §12-§14 duration ranges — one concrete default per
// mode, same "app chooses, never asks" rule as Right Now.
const MODE_DURATION_SECONDS: Record<BigMomentMode, number> = {
  before: 3 * 60,
  during: 60,
  after: 4 * 60,
};

// docs/PRODUCT_FLOW.md §13: "During skips Arrive by rule." Before/After use
// Arrive like Right Now.
const MODE_REQUIRES_ARRIVE: Record<BigMomentMode, boolean> = {
  before: true,
  during: false,
  after: true,
};

const MODE_TITLE: Record<BigMomentMode, string> = {
  before: "Get Ready",
  during: "Stay Steady",
  after: "Come Back to Yourself",
};

export function getSituationOptions(mode: BigMomentMode): SituationOption[] {
  return SITUATIONS[mode];
}

export function findSituation(mode: BigMomentMode, situationId: string): SituationOption | undefined {
  return SITUATIONS[mode].find((option) => option.id === situationId);
}

export function composeBigMomentPause(
  mode: BigMomentMode,
  options: { situationId?: string | null; categoryId?: PauseCategoryId } = {},
): PauseDefinition {
  const situation = options.situationId ? findSituation(mode, options.situationId) : undefined;
  const categoryId = options.categoryId ?? situation?.categoryId ?? DEFAULT_CATEGORY[mode];
  const base = composeRightNowPause(categoryId);
  const title = situation ? `${situation.label} — ${MODE_TITLE[mode]}` : MODE_TITLE[mode];
  const requiresArrive = MODE_REQUIRES_ARRIVE[mode];

  return {
    ...base,
    pauseType: "big-moment",
    outcomeId: undefined,
    title,
    durationSeconds: MODE_DURATION_SECONDS[mode],
    requiresArrive,
    // During has no Arrive and no transition copy at all — an empty array
    // makes the player's transition phase advance immediately rather than
    // waiting out the Ground Pause's brief "Get comfortable" window, since
    // §13 calls for near-zero friction, not just "no I'm ready."
    arrivalGuidance: requiresArrive ? base.arrivalGuidance : [],
    // Mode-toned playback content (docs/PRODUCT_FLOW.md §7), not the
    // underlying Right Now category's cues — Before/During/After each have
    // their own duration and emotional job, so their cues do too.
    playbackCues: buildBigMomentPlaybackCues(mode, base.chakraName, base.frequencyLabel),
  };
}

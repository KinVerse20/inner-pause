import type { BigMomentMode } from "@inner-pause/shared";
import { composeRightNowPause, type PauseDefinition } from "@/lib/pause-engine";
import type { PauseCategoryId } from "@/lib/pause-categories";
import { buildBigMomentPlaybackCues } from "@/lib/session-content";

// Big Moments compose by reusing composeRightNowPause's chakra/frequency/
// audio selection for a category — the actual sound framework mapping is
// never re-invented here (docs/TECHNICAL_ARCHITECTURE.md §5's "reusing this
// same PauseDefinition shape") — and overriding only the mode-specific
// fields (title, duration, Arrive rule) per docs/PRODUCT_FLOW.md §12-§14.
export type { BigMomentMode };

export interface SituationOption {
  id: string;
  label: string;
  /** One calm line on what this Pause helps with. */
  subtitle?: string;
  categoryId: PauseCategoryId;
}

// Mode-specific situations. The first five per mode are the compact,
// immediately-understandable set shown by default (docs/PRODUCT_FLOW.md
// §11); the rest appear behind "More moments" (progressive disclosure).
// Wording and breadth come from Kinverse's ready-made moments
// (lib/phase-one-data.ts on feature/practice-guided-breathing-mindspace);
// each maps to one of our six Right Now categories by its emotions, so the
// sound framework is unchanged. Ids already stored on Moment records keep
// their meaning.
const SITUATIONS: Record<BigMomentMode, SituationOption[]> = {
  before: [
    { id: "interview", label: "Interview or presentation", subtitle: "Enter with clarity and confidence", categoryId: "confidence" },
    { id: "difficult-conversation", label: "A difficult conversation", subtitle: "Stay calm and speak clearly", categoryId: "calm" },
    { id: "big-event", label: "A big event", subtitle: "Feel steady before it begins", categoryId: "confidence" },
    { id: "exam", label: "Exam or important test", subtitle: "Settle pressure and find focus", categoryId: "focus" },
    { id: "big-decision", label: "A big decision", subtitle: "Create space for clarity", categoryId: "focus" },
    { id: "future-worry", label: "Anxious about the future", subtitle: "Return to what you can hold now", categoryId: "calm" },
    { id: "first-day", label: "A first day", subtitle: "Meet something new with steadiness", categoryId: "confidence" },
    { id: "appointment", label: "An important appointment", subtitle: "Make room around uncertainty", categoryId: "calm" },
    { id: "performance", label: "A performance", subtitle: "Feel capable and present", categoryId: "confidence" },
    { id: "meeting-people", label: "Meeting new people", subtitle: "Arrive open and grounded", categoryId: "confidence" },
    { id: "travel-change", label: "Travel or a new place", subtitle: "Feel grounded through change", categoryId: "calm" },
    { id: "sleep-before-event", label: "Sleep before an important day", subtitle: "Let tomorrow wait until tomorrow", categoryId: "sleep" },
    { id: "something-else", label: "Something else", subtitle: "Get ready, whatever it is", categoryId: "confidence" },
  ],
  during: [
    { id: "feeling-overwhelmed", label: "Everything feels too much", subtitle: "Slow the moment down", categoryId: "reset" },
    { id: "difficult-conversation", label: "In the middle of an argument", subtitle: "Pause before the next response", categoryId: "calm" },
    { id: "racing-mind", label: "My mind won't stop", subtitle: "Give your thoughts more room", categoryId: "calm" },
    { id: "important-meeting", label: "An important meeting", subtitle: "Stay clear and present", categoryId: "focus" },
    { id: "anger-now", label: "Anger is rising", subtitle: "Let it move without acting on it", categoryId: "calm" },
    { id: "work-overwhelm", label: "Overwhelmed at work", subtitle: "Find the next manageable step", categoryId: "reset" },
    { id: "cannot-focus", label: "Unable to focus", subtitle: "Return to one clear point", categoryId: "focus" },
    { id: "lonely-now", label: "Feeling alone", subtitle: "Stay gently connected to yourself", categoryId: "calm" },
    { id: "rejected-now", label: "Feeling rejected", subtitle: "Make space around the hurt", categoryId: "release" },
    { id: "confidence-now", label: "Confidence has dropped", subtitle: "Reconnect with your strength", categoryId: "confidence" },
    { id: "unsettled-now", label: "Feeling unsettled", subtitle: "Come back to steadiness", categoryId: "calm" },
    { id: "grief-now", label: "A wave of grief", subtitle: "Let the feeling be held", categoryId: "release" },
    { id: "cannot-speak", label: "Unable to speak up", subtitle: "Find your voice without forcing it", categoryId: "confidence" },
    { id: "waiting-for-something", label: "Waiting for something", subtitle: "Make the wait a little lighter", categoryId: "calm" },
    { id: "something-else", label: "Something else", subtitle: "Stay with yourself, whatever it is", categoryId: "calm" },
  ],
  after: [
    { id: "argument", label: "Just had a fight", subtitle: "Come down before deciding what comes next", categoryId: "release" },
    { id: "something-went-wrong", label: "Something did not work out", subtitle: "Recover your sense of capability", categoryId: "reset" },
    { id: "result-rejection", label: "Experienced rejection", subtitle: "Return to yourself with care", categoryId: "release" },
    { id: "made-mistake", label: "Made a mistake", subtitle: "Separate the moment from your worth", categoryId: "reset" },
    { id: "bad-news", label: "Received difficult news", subtitle: "Create room for what you are feeling", categoryId: "calm" },
    { id: "difficult-conversation", label: "A conversation went badly", subtitle: "Release what stayed unsaid", categoryId: "release" },
    { id: "embarrassed", label: "Feeling embarrassed", subtitle: "Let the moment become smaller", categoryId: "release" },
    { id: "loss", label: "Experienced a loss", subtitle: "Be with grief without rushing it", categoryId: "release" },
    { id: "betrayal", label: "Trust was broken", subtitle: "Hold the hurt without carrying it alone", categoryId: "release" },
    { id: "something-else", label: "Something else", subtitle: "Come back to yourself, whatever it was", categoryId: "release" },
  ],
};

/** How many situations a mode shows before "More moments". */
export const SITUATIONS_SHOWN_FIRST = 5;

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

// docs/PRODUCT_FLOW.md §13: "During skips Arrive by rule." Now every Moment
// starts at once: the sound and clock run from the first tap.
// Coming up and Just happened offer letting it out inside the running
// Pause (components/let-it-out.tsx), never as a step before it.
const MODE_REQUIRES_ARRIVE: Record<BigMomentMode, boolean> = {
  before: false,
  during: false,
  after: false,
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
  // Centered dot, never a dash, in user-facing copy (DESIGN_SYSTEM.md §14).
  const title = situation && situation.id !== "something-else" ? `${situation.label} · ${MODE_TITLE[mode]}` : MODE_TITLE[mode];
  const requiresArrive = MODE_REQUIRES_ARRIVE[mode];

  return {
    ...base,
    pauseType: "big-moment",
    momentMode: mode,
    outcomeId: undefined,
    title,
    durationSeconds: MODE_DURATION_SECONDS[mode],
    requiresArrive,
    // No Arrive and no transition copy: an empty array makes the player's
    // transition advance immediately rather than waiting out the Ground
    // Pause's brief "Get comfortable" (§13: near-zero friction).
    arrivalGuidance: requiresArrive ? base.arrivalGuidance : [],
    // Mode-toned playback content (docs/PRODUCT_FLOW.md §7), not the
    // underlying Right Now category's cues — Before/During/After each have
    // their own duration and emotional job, so their cues do too.
    playbackCues: buildBigMomentPlaybackCues(mode, base.chakraName, base.frequencyLabel),
  };
}

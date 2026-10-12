import type { BigMomentMode } from "@/lib/big-moment-engine";
import type { PauseCategoryId } from "@/lib/pause-categories";
import type { PracticeSkillId } from "@/lib/practice-skills";

// The shared session-aware content layer (docs/PRODUCT_FLOW.md §7): one
// content model reused by Right Now, the Ground Pause, Big Moments, and
// Practice — never a second content system, never a quote feed, never a
// gratitude or reminder module. Content is sparse, pre-authored, and
// deterministic; the only thing composers vary is which small set of
// authored lines applies to their context (docs/PRODUCT_FLOW.md §7's four
// roles plus gentle reminders).

export type PlaybackCueKind = "guidance" | "quote" | "chakra" | "gratitude" | "reminder";

export interface PlaybackCue {
  kind: PlaybackCueKind;
  /** One line normally; chakra cues may use two (label + short detail). */
  lines: string[];
}

// Themes are keyed by the same ids already used for Right Now outcomes and
// Practice skills — "confidence" deliberately means the same thing in both,
// since they're thematically identical (§7: "reuse... rather than a
// separate content system per surface").
export type ThemeId = PauseCategoryId | Exclude<PracticeSkillId, "confidence">;

// Two short guidance lines per theme: an opening tone and a closing tone.
// Tone only, not a locked script (docs/PRODUCT_FLOW.md §7) — small and
// deliberately not exhaustive ("do not build a large content library").
const THEME_GUIDANCE: Record<ThemeId, [string, string]> = {
  sleep: ["Let the day become quieter.", "There's nowhere else you need to be."],
  reset: ["Nothing needs to be solved in this moment.", "Give your mind somewhere to settle."],
  focus: ["One thing at a time is enough.", "Let the rest wait."],
  confidence: ["You don't need to have the perfect answer.", "Let yourself speak."],
  calm: ["Nothing here needs to be fixed right now.", "Let your breathing lead."],
  release: ["You can notice what you're holding without carrying it further.", "It's safe to loosen your grip."],
  "self-trust": ["You already know more than you're giving yourself credit for.", "Your own judgment is allowed to be enough."],
  uncertainty: ["You don't need the whole path to take the next step.", "Not knowing yet is not the same as being lost."],
  "emotional-regulation": ["This feeling can move through you without taking over.", "You can feel this and still be steady."],
  "letting-go": ["You can set this down for now.", "Holding on tighter won't make it lighter."],
  presence: ["This moment doesn't ask anything else of you.", "You can be here without needing it to be different."],
  "self-compassion": ["You're allowed to be gentle with yourself right now.", "You don't have to earn rest or kindness."],
};

// One short, original contextual line per theme (docs/PRODUCT_FLOW.md §7's
// second role) — never a quote feed, shown only when it's this session's
// selected theme.
const THEME_QUOTES: Record<ThemeId, string> = {
  sleep: "Rest doesn't have to be earned.",
  reset: "You can start again without starting over.",
  focus: "Clarity doesn't need to be forced.",
  confidence: "You can be uncertain and still speak.",
  calm: "You're allowed to feel steadier before you feel sure.",
  release: "What you're carrying can soften.",
  "self-trust": "You don't need permission to trust yourself.",
  uncertainty: "Some things become clear only by moving.",
  "emotional-regulation": "Strong feelings are information, not instructions.",
  "letting-go": "Not everything needs to come with you.",
  presence: "This moment doesn't need your past or your future.",
  "self-compassion": "You don't have to earn kindness from yourself.",
};

// Themes where an appreciation cue genuinely fits the emotional register —
// role 4 is "occasional... only where contextually appropriate"
// (docs/PRODUCT_FLOW.md §7), not universal. Sleep/focus/confidence stay
// guidance-and-quote only; the more reflective themes occasionally include one.
const GRATITUDE_ELIGIBLE_THEMES: ThemeId[] = ["reset", "calm", "release", "presence", "letting-go", "self-compassion"];

const GRATITUDE_CUES = [
  "What felt good today?",
  "What's one thing you're glad happened?",
  "Notice something you usually overlook.",
] as const;

// Very low frequency by design (docs/PRODUCT_FLOW.md §7 role 5) — never
// guilt-based, never toxic positivity, never telling the user how to feel.
const GENTLE_REMINDERS = [
  "Take your time.",
  "It's okay to pause.",
  "You don't have to figure everything out right now.",
  "You can come back to this when you're ready.",
  "Let today be enough for today.",
] as const;

const BIG_MOMENT_GUIDANCE: Record<BigMomentMode, [string, string]> = {
  before: ["Whatever happens next, you can meet it.", "You don't need to be perfect, just present."],
  during: ["Stay with yourself.", "This will pass."],
  after: ["It's over now.", "You can let your body know it's safe to settle."],
};

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

// Deterministic, not random and not AI: the same seed always produces the
// same pick, so a specific theme's gratitude line is stable and testable,
// while different themes/modes naturally land on different lines.
function pickDeterministic<T>(items: readonly T[], seed: string): T {
  return items[hashString(seed) % items.length];
}

// Content role 3 (docs/PRODUCT_FLOW.md §7): derived entirely from data the
// composer already has (chakraName/frequencyLabel), not a separately
// authored bank — one compact line, the same information the player used
// to show permanently in its header, now surfaced only occasionally.
export function buildChakraCue(chakraName: string, frequencyLabel: string): PlaybackCue {
  return { kind: "chakra", lines: [`${chakraName.replace(" Chakra", "")} · ${frequencyLabel}`] };
}

function gratitudeCueFor(theme: ThemeId): PlaybackCue | null {
  if (!GRATITUDE_ELIGIBLE_THEMES.includes(theme)) return null;
  return { kind: "gratitude", lines: [pickDeterministic(GRATITUDE_CUES, `gratitude:${theme}`)] };
}

// Right Now / Practice cue sequence: opening guidance, then either the
// theme's contextual line or (only for eligible themes) an appreciation
// cue, then an occasional chakra cue, closing on guidance so the Pause
// Player's closing beat (which reuses the last cue) always reads as
// guidance, never as a bare chakra label.
export function buildThemePlaybackCues(theme: ThemeId, chakraName: string, frequencyLabel: string): PlaybackCue[] {
  const [opening, closing] = THEME_GUIDANCE[theme];
  const secondSlot = gratitudeCueFor(theme) ?? { kind: "quote" as const, lines: [THEME_QUOTES[theme]] };
  return [
    { kind: "guidance", lines: [opening] },
    secondSlot,
    buildChakraCue(chakraName, frequencyLabel),
    { kind: "guidance", lines: [closing] },
  ];
}

// Big Moments — Before/After: same shape as the theme sequence above, but
// mode-toned rather than outcome-toned, matching §12/§14's distinct copy
// from Right Now. During (§13) is near-zero friction by rule: a single
// steadying line, no chakra cue, no rotation.
export function buildBigMomentPlaybackCues(mode: BigMomentMode, chakraName: string, frequencyLabel: string): PlaybackCue[] {
  const [opening, closing] = BIG_MOMENT_GUIDANCE[mode];
  if (mode === "during") {
    return [{ kind: "guidance", lines: [opening] }];
  }
  // "release" is always gratitude-eligible (see GRATITUDE_ELIGIBLE_THEMES),
  // so After always gets one reflective beat plus the chakra cue; Before
  // gets just the chakra cue.
  const middle: PlaybackCue[] =
    mode === "after"
      ? [gratitudeCueFor("release") as PlaybackCue, buildChakraCue(chakraName, frequencyLabel)]
      : [buildChakraCue(chakraName, frequencyLabel)];
  return [{ kind: "guidance", lines: [opening] }, ...middle, { kind: "guidance", lines: [closing] }];
}

// The Ground Pause: immersive and brief by design (§7), so no chakra cue
// and no gratitude — just breath-focused guidance, closing on a gentle
// reminder on a small, deterministic minority of days rather than never or
// always (§7 role 5's "very low frequency," not zero and not constant).
export function buildGroundPlaybackCues(dayOfMonth: number): PlaybackCue[] {
  const closing: PlaybackCue =
    dayOfMonth % 5 === 0
      ? { kind: "reminder", lines: [pickDeterministic(GENTLE_REMINDERS, `ground:${dayOfMonth}`)] }
      : { kind: "guidance", lines: ["Take one last slow breath."] };
  return [
    { kind: "guidance", lines: ["Notice your breath."] },
    { kind: "guidance", lines: ["Let your shoulders soften."] },
    closing,
  ];
}

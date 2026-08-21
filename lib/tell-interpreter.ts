import type { BigMomentMode } from "@/lib/big-moment-engine";
import { pauseCategories, type PauseCategoryId } from "@/lib/pause-categories";
import type { TellInterpretation } from "@/lib/tell-storage";

// Mirrors lib/big-moment-engine.ts's DEFAULT_CATEGORY — kept as a separate,
// modest nudge here (same weight class as a single chip) rather than an
// import of that engine's internals, so "Tell within Moments"
// (components/moments-screen.tsx) can bias interpretation toward the
// mode's likely intent without the two modules needing to share state.
const MOMENT_MODE_BOOST: Record<BigMomentMode, PauseCategoryId> = {
  before: "confidence",
  during: "calm",
  after: "release",
};

// Deterministic-first routing for Tell Inner Pause free text
// (docs/PRODUCT_FLOW.md §38 "Rules for known behaviour. AI for unknown
// meaning."). Phrase banks are weighted, not exhaustive NLP — the goal is
// to confidently resolve clear-cut expressions without a network call, and
// only fall back to AI (via /api/tell-interpret) for genuinely ambiguous
// free-form text.
const PHRASE_WEIGHTS: Record<PauseCategoryId, Array<[string, number]>> = {
  sleep: [
    ["can't sleep", 3], ["cant sleep", 3], ["can't fall asleep", 3], ["insomnia", 3],
    ["trouble sleeping", 3], ["wide awake", 2], ["bedtime", 2], ["restless at night", 2],
    ["sleep", 1], ["tired", 1], ["exhausted", 1], ["awake at night", 2],
  ],
  reset: [
    ["need a reset", 3], ["too much going on", 2], ["everything at once", 2],
    ["burnt out", 2], ["burned out", 2], ["chaotic", 2], ["need a break", 2],
    ["start over", 2], ["reset", 1], ["overwhelmed", 1],
  ],
  focus: [
    ["can't focus", 3], ["cant focus", 3], ["can't concentrate", 3], ["cant concentrate", 3],
    ["can't think straight", 2], ["distracted", 2], ["procrastinating", 2], ["deadline", 2],
    ["so much to do", 1], ["focus", 1], ["concentrate", 1],
  ],
  confidence: [
    ["presentation", 3], ["interview", 3], ["public speaking", 3], ["self-doubt", 2],
    ["not good enough", 2], ["mess up", 2], ["big decision", 2], ["nervous about", 2],
    ["confidence", 1], ["nervous", 1],
  ],
  calm: [
    ["panicking", 3], ["panic", 3], ["racing thoughts", 3], ["can't calm down", 3],
    ["cant calm down", 3], ["can't relax", 2], ["on edge", 2], ["worried", 1],
    ["stressed", 1], ["anxious", 1], ["restless", 1],
  ],
  release: [
    ["let go", 3], ["holding onto", 3], ["resentment", 2], ["grief", 2],
    ["crying", 2], ["mad at", 2], ["frustrated", 1], ["angry", 1], ["hurt", 1], ["sad", 1], ["upset", 1],
  ],
};

// Optional emotion/context chips (docs/PRODUCT_FLOW.md §6's example set)
// nudge scores toward the categories they're most associated with — a
// modest boost, not a deciding vote, since chips remain optional assistance.
const CHIP_WEIGHTS: Record<string, Array<[PauseCategoryId, number]>> = {
  Anxious: [["calm", 2], ["confidence", 1]],
  Stuck: [["reset", 2], ["focus", 1]],
  Behind: [["reset", 1], ["focus", 2]],
  Uncertain: [["confidence", 2], ["calm", 1]],
  Overwhelmed: [["reset", 2], ["release", 1]],
  Low: [["sleep", 1], ["release", 2]],
};

export const tellChips = Object.keys(CHIP_WEIGHTS);

function scoreDeterministic(text: string, chips: string[], momentMode?: BigMomentMode): Record<PauseCategoryId, number> {
  const normalized = text.toLowerCase();
  const scores = Object.fromEntries(pauseCategories.map((category) => [category.id, 0])) as Record<PauseCategoryId, number>;

  for (const category of pauseCategories) {
    for (const [phrase, weight] of PHRASE_WEIGHTS[category.id]) {
      if (normalized.includes(phrase)) scores[category.id] += weight;
    }
  }
  for (const chip of chips) {
    for (const [categoryId, weight] of CHIP_WEIGHTS[chip] ?? []) {
      scores[categoryId] += weight;
    }
  }
  if (momentMode) {
    scores[MOMENT_MODE_BOOST[momentMode]] += 1;
  }
  return scores;
}

// A real sentence with no phrase-bank match is not the same as a genuinely
// unclear input — someone who writes several words about what's going on
// has told us *something* meaningful, even if no known phrase matched it.
// Reserving "unclear" for input this short keeps that state honest (§16:
// "genuinely unclear," not "the phrase bank didn't happen to cover this").
const MIN_MEANINGFUL_WORDS = 4;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// When there's no phrase-bank signal at all, the Big Moment mode (if any)
// is the only context available — reuse it as a starting point rather than
// a fixed generic trio, same weight class as the existing MOMENT_MODE_BOOST
// nudge above, not a new per-sentence special case.
function broadFallbackCandidates(momentMode?: BigMomentMode): PauseCategoryId[] {
  const base: PauseCategoryId[] = ["calm", "release", "reset"];
  const modeCategory = momentMode ? MOMENT_MODE_BOOST[momentMode] : undefined;
  if (!modeCategory) return base;
  return [modeCategory, ...base.filter((id) => id !== modeCategory)].slice(0, 3);
}

// A clear top score, meaningfully ahead of the runner-up, is treated as
// confident enough to route directly. Anything closer (or a genuine
// zero-signal input) is ambiguous — the UI shows a short list of choices
// rather than guessing wrong with false confidence.
export function classifyTellInput(text: string, chips: string[], momentMode?: BigMomentMode): TellInterpretation {
  const scores = scoreDeterministic(text, chips, momentMode);
  const ranked = (Object.entries(scores) as Array<[PauseCategoryId, number]>).sort((a, b) => b[1] - a[1]);
  const [topId, topScore] = ranked[0];
  const runnerUpScore = ranked[1]?.[1] ?? 0;

  if (topScore === 0) {
    if (wordCount(text) >= MIN_MEANINGFUL_WORDS) {
      const candidates = broadFallbackCandidates(momentMode);
      return {
        status: "ambiguous",
        primary: candidates[0],
        candidates,
        confidence: 0.2,
        method: "deterministic",
        rationale: "No single Pause category matched clearly, so here are a few that could fit.",
        reflection: buildReflection(text),
      };
    }
    return {
      status: "unclear",
      primary: null,
      candidates: ["calm", "reset", "focus"],
      confidence: 0,
      method: "deterministic",
      rationale: "Nothing in the text matched a known Pause category clearly.",
    };
  }

  const confidence = Math.min(1, topScore / (topScore + runnerUpScore + 1));
  const isConfident = topScore >= 2 && topScore >= runnerUpScore * 1.5;

  if (isConfident) {
    return {
      status: "confident",
      primary: topId,
      candidates: [topId],
      confidence,
      method: "deterministic",
      rationale: `What you shared most closely matches ${topId}.`,
    };
  }

  const scored = ranked.filter(([, score]) => score > 0).slice(0, 3).map(([id]) => id);
  // A lone scored candidate usually means the only real signal was the
  // moment-mode nudge itself (e.g. a "before" Tell with no phrase-bank
  // match) — round it out to a small set instead of offering just one
  // option under "a few different Pauses could help."
  const candidates =
    scored.length >= 2 ? scored : [topId, ...broadFallbackCandidates(momentMode).filter((id) => id !== topId)].slice(0, 3);
  return {
    status: "ambiguous",
    primary: topId,
    candidates,
    confidence,
    method: "deterministic",
    rationale: "A few different Pauses could fit what you shared.",
    reflection: buildReflection(text),
  };
}

// A short, honest quote-back of what the user actually said — never a
// paraphrase we might get wrong, just their own words, so the Ambiguous
// state reads as "I heard you," not a bare set of category cards
// (docs/PRODUCT_FLOW.md §16). Exported for app/api/tell-interpret/route.ts,
// which needs the identical reflection when the AI path itself comes back
// under-confident (§16's three states apply to the AI path too, not just
// the deterministic one).
export function buildReflection(text: string): string {
  const trimmed = text.trim();
  const truncated = trimmed.length > 140 ? `${trimmed.slice(0, 140).trimEnd()}…` : trimmed;
  return `I heard: "${truncated}"`;
}

// Client entry point: resolve deterministically first, no network call
// (docs/PRODUCT_FLOW.md §38 — rules for known behaviour). Only ambiguous or
// unclear text reaches the AI boundary (/api/tell-interpret), and even then
// degrades gracefully back to the deterministic candidates on any failure.
export async function interpretTellInput(text: string, chips: string[], momentMode?: BigMomentMode): Promise<TellInterpretation> {
  const deterministic = classifyTellInput(text, chips, momentMode);
  if (deterministic.status === "confident") return deterministic;

  try {
    const response = await fetch("/api/tell-interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, chips, momentMode }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return deterministic;
    const payload = (await response.json()) as { result?: TellInterpretation };
    return payload.result ?? deterministic;
  } catch {
    return deterministic;
  }
}

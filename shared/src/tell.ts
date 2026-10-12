import { pauseCategoryIds, type PauseCategoryId } from "./pause-categories";
import type { BigMomentMode, TellInterpretation } from "./types";

const MOMENT_MODE_BOOST: Record<BigMomentMode, PauseCategoryId> = {
  before: "confidence",
  during: "calm",
  after: "release",
};

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
  const scores = Object.fromEntries(pauseCategoryIds.map((id) => [id, 0])) as Record<PauseCategoryId, number>;

  for (const categoryId of pauseCategoryIds) {
    for (const [phrase, weight] of PHRASE_WEIGHTS[categoryId]) {
      if (normalized.includes(phrase)) scores[categoryId] += weight;
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

const MIN_MEANINGFUL_WORDS = 4;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function broadFallbackCandidates(momentMode?: BigMomentMode): PauseCategoryId[] {
  const base: PauseCategoryId[] = ["calm", "release", "reset"];
  const modeCategory = momentMode ? MOMENT_MODE_BOOST[momentMode] : undefined;
  if (!modeCategory) return base;
  return [modeCategory, ...base.filter((id) => id !== modeCategory)].slice(0, 3);
}

export function buildReflection(text: string): string {
  const trimmed = text.trim();
  const truncated = trimmed.length > 140 ? `${trimmed.slice(0, 140).trimEnd()}…` : trimmed;
  return `I heard: "${truncated}"`;
}

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

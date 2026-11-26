import { pauseCategoryIds, type PauseCategoryId } from "./pause-categories";
import type { BigMomentMode, TellInterpretation } from "./types";

const MOMENT_MODE_BOOST: Record<BigMomentMode, PauseCategoryId> = {
  before: "confidence",
  during: "calm",
  after: "release",
};

// Everyday Hinglish too, spelled the way Speak writes Hindi in English
// letters (frontend/lib/hinglish.ts) and the way people type it.
const PHRASE_WEIGHTS: Record<PauseCategoryId, Array<[string, number]>> = {
  sleep: [
    ["can't sleep", 3], ["cant sleep", 3], ["can't fall asleep", 3], ["insomnia", 3],
    ["trouble sleeping", 3], ["wide awake", 2], ["bedtime", 2], ["restless at night", 2],
    ["sleep", 1], ["tired", 1], ["exhausted", 1], ["awake at night", 2],
    ["neend nahi", 3], ["neend nahin", 3], ["so nahi pa", 3], ["so nahi paa", 3], ["raat bhar", 2], ["neend", 1], ["thak gaya", 1], ["thak gayi", 1], ["thaka hua", 1],
  ],
  reset: [
    ["need a reset", 3], ["too much going on", 2], ["everything at once", 2],
    ["burnt out", 2], ["burned out", 2], ["chaotic", 2], ["need a break", 2],
    ["start over", 2], ["reset", 1], ["overwhelmed", 1],
    ["sab kuch ek saath", 3], ["sab ek saath", 2], ["bahut zyada ho gaya", 2], ["bahut kaam", 2], ["dimag kharab", 2],
  ],
  focus: [
    ["can't focus", 3], ["cant focus", 3], ["can't concentrate", 3], ["cant concentrate", 3],
    ["can't think straight", 2], ["distracted", 2], ["procrastinating", 2], ["deadline", 2],
    ["so much to do", 1], ["focus", 1], ["concentrate", 1],
    ["dhyan nahi", 3], ["dhyaan nahi", 3], ["focus nahi", 3], ["man nahi lag", 3], ["mann nahi lag", 3], ["padhai", 2], ["padhne mein", 2],
  ],
  confidence: [
    ["presentation", 3], ["interview", 3], ["public speaking", 3], ["self-doubt", 2],
    ["not good enough", 2], ["mess up", 2], ["big decision", 2], ["nervous about", 2],
    ["confidence", 1], ["nervous", 1],
    ["himmat nahi", 3], ["bharosa nahi", 3], ["nahi kar paunga", 3], ["nahi kar paungi", 3], ["kar paunga", 2], ["kar paungi", 2], ["bol nahi pa", 2],
  ],
  calm: [
    ["panicking", 3], ["panic", 3], ["racing thoughts", 3], ["can't calm down", 3],
    ["cant calm down", 3], ["can't relax", 2], ["on edge", 2], ["worried", 1],
    ["stressed", 1], ["anxious", 1], ["restless", 1],
    ["ghabrahat", 3], ["ghabraahat", 3], ["tension ho rahi", 3], ["tension", 2], ["dar lag", 3], ["darr lag", 3], ["bechain", 2], ["pareshan", 2], ["chinta", 2], ["akela", 2], ["akeli", 2],
  ],
  release: [
    ["let go", 3], ["holding onto", 3], ["resentment", 2], ["grief", 2],
    ["crying", 2], ["mad at", 2], ["frustrated", 1], ["angry", 1], ["hurt", 1], ["sad", 1], ["upset", 1],
    ["rona aa", 3], ["dil toot", 3], ["gussa", 2], ["dukhi", 2], ["bura lag", 2], ["naraz", 2], ["naaraz", 2], ["udaas", 2], ["udas", 2], ["chhod", 1],
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

// "Choose how you feel" — Kinverse's emotion catalog
// (packages/shared/src/emotion-catalog.ts on
// feature/practice-guided-breathing-mindspace), for picking feelings
// without writing. Each maps onto our six Pause categories; the strongest
// category wins exactly like a typed description would.
const EMOTION_WEIGHTS: Record<string, Array<[PauseCategoryId, number]>> = {
  Anxiety: [["calm", 3]],
  Fear: [["calm", 3]],
  Insecurity: [["confidence", 2], ["calm", 1]],
  Overwhelm: [["reset", 3]],
  "Self-doubt": [["confidence", 3]],
  Powerlessness: [["confidence", 2], ["reset", 1]],
  Shame: [["release", 2], ["confidence", 1]],
  Guilt: [["release", 3]],
  Sadness: [["release", 2], ["calm", 1]],
  Grief: [["release", 3]],
  Loneliness: [["calm", 2], ["release", 1]],
  Hurt: [["release", 3]],
  Resentment: [["release", 3]],
  Frustration: [["reset", 2], ["release", 1]],
  Anger: [["calm", 2], ["release", 1]],
  "Feeling unheard": [["confidence", 2], ["release", 1]],
  Confusion: [["focus", 3]],
  Overthinking: [["calm", 2], ["sleep", 1]],
  "Creative block": [["focus", 2], ["reset", 1]],
  "Emotional numbness": [["reset", 2], ["release", 1]],
  Disconnection: [["reset", 2], ["calm", 1]],
  "Lack of purpose": [["focus", 2], ["confidence", 1]],
};

export const tellEmotions = Object.keys(EMOTION_WEIGHTS);
export const MAX_TELL_EMOTIONS = 4;

function scoreDeterministic(text: string, chips: string[], momentMode?: BigMomentMode): Record<PauseCategoryId, number> {
  const normalized = text.toLowerCase();
  const scores = Object.fromEntries(pauseCategoryIds.map((id) => [id, 0])) as Record<PauseCategoryId, number>;

  for (const categoryId of pauseCategoryIds) {
    for (const [phrase, weight] of PHRASE_WEIGHTS[categoryId]) {
      if (normalized.includes(phrase)) scores[categoryId] += weight;
    }
  }
  for (const chip of chips) {
    for (const [categoryId, weight] of CHIP_WEIGHTS[chip] ?? EMOTION_WEIGHTS[chip] ?? []) {
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

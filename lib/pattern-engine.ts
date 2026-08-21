import { getHighlight, listHighlights, type Highlight } from "@/lib/journey-highlights";
import { pauseCategories, type PauseCategoryId } from "@/lib/pause-categories";
import type { PatternScope } from "@/lib/pattern-storage";
import { listTellEntries, type TellEntry } from "@/lib/tell-storage";

// Deterministic pattern generation (docs/PRODUCT_FLOW.md §38 "Rules for
// known behaviour," docs/TECHNICAL_ARCHITECTURE.md §9's AI boundary reserved
// for genuinely nuanced interpretation, not simple recurring-keyword counts
// like these). No AI call in this file. Every candidate here is a plain
// count over the user's own stored material — never fabricated, never
// generated without enough supporting entries.

// A small, honest support threshold — "enough supporting material"
// (this slice's brief §5) is a content/product-tuning decision, not fixed
// by docs; 3 is a deliberately conservative floor.
const MIN_SUPPORT = 3;

// A modest, human-readable keyword set per existing Right Now category
// (lib/pause-categories.ts) — reused labels/taglines, not a new taxonomy —
// scoped to theme detection, not Tell's routing-confidence weights
// (lib/tell-interpreter.ts's PHRASE_WEIGHTS are tuned for a different job).
const THEME_KEYWORDS: Record<PauseCategoryId, string[]> = {
  sleep: ["sleep", "insomnia", "can't sleep", "tired", "awake at night"],
  reset: ["overwhelmed", "burnt out", "too much going on", "need a reset"],
  focus: ["focus", "distracted", "concentrate", "deadline"],
  confidence: ["confidence", "nervous", "interview", "presentation", "self-doubt"],
  calm: ["anxious", "panic", "stressed", "worried"],
  release: ["angry", "frustrated", "let go", "resentment", "upset"],
};

export interface PatternCandidate {
  key: string;
  text: string;
  supportingJournalEntryIds: string[];
  supportingHighlightIds: string[];
}

// Free scope only looks at a bounded recent window; Pass scope looks at
// full history (docs/PRODUCT_FLOW.md §36 / docs/TECHNICAL_ARCHITECTURE.md
// §7 — the boundary is on analysis depth, never on hiding the underlying
// entries themselves).
const FREE_WINDOW_ENTRIES = 20;

function scopedEntries(scope: PatternScope): TellEntry[] {
  const all = listTellEntries();
  return scope === "free" ? all.slice(0, FREE_WINDOW_ENTRIES) : all;
}

function scopedHighlights(scope: PatternScope): Highlight[] {
  const all = listHighlights();
  return scope === "free" ? all.slice(0, FREE_WINDOW_ENTRIES) : all;
}

function detectThemePatterns(scope: PatternScope): PatternCandidate[] {
  const entries = scopedEntries(scope);
  const candidates: PatternCandidate[] = [];

  for (const category of pauseCategories) {
    const keywords = THEME_KEYWORDS[category.id];
    const matches = entries.filter((entry) => {
      const normalized = entry.text.toLowerCase();
      return keywords.some((keyword) => normalized.includes(keyword));
    });
    if (matches.length < MIN_SUPPORT) continue;
    candidates.push({
      key: `theme:${category.id}`,
      text: `You've brought up ${category.label.toLowerCase()}-related themes ${matches.length} times recently.`,
      supportingJournalEntryIds: matches.map((entry) => entry.id),
      supportingHighlightIds: [],
    });
  }
  return candidates;
}

function detectSituationRecurrence(scope: PatternScope): PatternCandidate[] {
  const highlights = scopedHighlights(scope).filter((item) => item.sourceType === "moment" && item.timingLabel === "Before");
  const bySituation = new Map<string, Highlight[]>();
  for (const highlight of highlights) {
    const list = bySituation.get(highlight.title) ?? [];
    list.push(highlight);
    bySituation.set(highlight.title, list);
  }

  const candidates: PatternCandidate[] = [];
  for (const [situation, group] of bySituation) {
    if (group.length < MIN_SUPPORT) continue;
    candidates.push({
      key: `situation-before:${situation}`,
      text: `${situation} comes up often before you prepare for it — ${group.length} times so far.`,
      supportingJournalEntryIds: [],
      supportingHighlightIds: group.map((item) => item.id),
    });
  }
  return candidates;
}

function detectPauseHelpsPattern(scope: PatternScope): PatternCandidate[] {
  const highlights = scopedHighlights(scope).filter((item) => item.sourceType === "moment" && item.feedback);
  const bySituation = new Map<string, Highlight[]>();
  for (const highlight of highlights) {
    const list = bySituation.get(highlight.title) ?? [];
    list.push(highlight);
    bySituation.set(highlight.title, list);
  }

  const candidates: PatternCandidate[] = [];
  for (const [situation, group] of bySituation) {
    if (group.length < MIN_SUPPORT) continue;
    const betterCount = group.filter((item) => item.feedback === "better").length;
    if (betterCount / group.length < 0.6) continue;
    candidates.push({
      key: `pause-helps:${situation}`,
      text: `Taking a Pause around ${situation.toLowerCase()} tends to help — you felt better ${betterCount} of ${group.length} times.`,
      supportingJournalEntryIds: [],
      supportingHighlightIds: group.map((item) => item.id),
    });
  }
  return candidates;
}

export function generatePatternCandidates(scope: PatternScope): PatternCandidate[] {
  return [...detectThemePatterns(scope), ...detectSituationRecurrence(scope), ...detectPauseHelpsPattern(scope)];
}

export function resolvePatternHighlights(highlightIds: string[]) {
  return highlightIds
    .map((id) => {
      const [sourceType, sourceId] = id.split(":") as ["moment" | "practice", string];
      return getHighlight(sourceType, sourceId);
    })
    .filter((item): item is Highlight => item !== null);
}

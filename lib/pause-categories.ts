import { chakraMap } from "@/data/chakras";
import type { ChakraId, RelaxMoodId } from "@/lib/types";
import type { EmotionalAnalysis } from "@/lib/mvp-types";
import { createJournalEntry, saveAnalysis, savePlan } from "@/lib/mvp-storage";

// Design 6 Home-tab categories. Each maps onto an existing ChakraId so the
// Pause detail screen, quick-pause session, and audio/content library
// (data/chakras.ts) can be reused as-is — only the user-facing label and
// tone change at the presentation layer, per the "keep ChakraId internal,
// rename display strings" decision. Mappings mirror the existing
// `relaxMoods` associations in data/chakras.ts where one already exists
// (sleep/focus/confidence/calm); "reset" is a new label for the root
// chakra's grounding theme, reusing the "grounded" mood icon.
// "release" added per docs/PRODUCT_FLOW.md §5's six Right Now outcomes
// (Sleep · Reset · Focus · Confidence · Calm · Release) — extends the
// existing 5-tile model rather than replacing it, per
// docs/TECHNICAL_ARCHITECTURE.md §3's REFACTOR classification.
export type PauseCategoryId = "sleep" | "reset" | "focus" | "confidence" | "calm" | "release";

export interface PauseCategory {
  id: PauseCategoryId;
  label: string;
  tone: "sleep" | "reset" | "focus" | "confidence" | "calm" | "release";
  chakraId: ChakraId;
  moodId: RelaxMoodId;
  tagline: string;
}

export const pauseCategories: PauseCategory[] = [
  { id: "sleep", label: "Sleep", tone: "sleep", chakraId: "crown", moodId: "sleep", tagline: "Quiet down for rest" },
  { id: "reset", label: "Reset", tone: "reset", chakraId: "root", moodId: "grounded", tagline: "Ground and restart" },
  { id: "focus", label: "Focus", tone: "focus", chakraId: "third-eye", moodId: "focus", tagline: "Clear distractions" },
  { id: "confidence", label: "Confidence", tone: "confidence", chakraId: "solar-plexus", moodId: "confidence", tagline: "Build inner strength" },
  { id: "calm", label: "Calm", tone: "calm", chakraId: "heart", moodId: "calm", tagline: "Slow down and settle" },
  { id: "release", label: "Release", tone: "release", chakraId: "sacral", moodId: "emotionally-lighter", tagline: "Let go of what you're holding" },
];

export const pauseCategoryMap: Record<PauseCategoryId, PauseCategory> = Object.fromEntries(
  pauseCategories.map((category) => [category.id, category]),
) as Record<PauseCategoryId, PauseCategory>;

export function isPauseCategoryId(value: string): value is PauseCategoryId {
  return value in pauseCategoryMap;
}

// Simple, explainable time-of-day suggestion for Home's "Picked for you" row
// (docs/PRODUCT_ROADMAP.md #3) — deliberately not framed as AI/ML-personalized,
// since it isn't. Each window has an honest, statable reason.
export function getSuggestedCategory(hour: number, exclude?: PauseCategoryId): { category: PauseCategory; reason: string } {
  const suggestion =
    hour >= 5 && hour < 10
      ? { id: "focus" as PauseCategoryId, reason: "Start the day with clear focus" }
      : hour >= 10 && hour < 14
        ? { id: "reset" as PauseCategoryId, reason: "Good time for a midday reset" }
        : hour >= 14 && hour < 18
          ? { id: "confidence" as PauseCategoryId, reason: "Afternoon energy dip — a confidence boost helps" }
          : hour >= 18 && hour < 22
            ? { id: "calm" as PauseCategoryId, reason: "Wind down as the day closes" }
            : { id: "sleep" as PauseCategoryId, reason: "Quiet the mind before rest" };

  if (suggestion.id !== exclude) return { category: pauseCategoryMap[suggestion.id], reason: suggestion.reason };

  // Avoid suggesting the same category already shown in "Continue".
  const fallbackOrder: PauseCategoryId[] = ["calm", "reset", "focus", "confidence", "sleep"];
  const fallbackId = fallbackOrder.find((id) => id !== exclude) ?? "calm";
  return { category: pauseCategoryMap[fallbackId], reason: pauseCategoryMap[fallbackId].tagline };
}

// Builds a single-chakra EmotionalAnalysis for a category-driven "Quick
// Pause" (tapping a Home tile), as opposed to the AI/fallback analysis
// generated from real journal text. This lets Quick Pause reuse the existing
// journal-entry -> analysis -> plan -> player -> feedback pipeline as-is
// (createHealingPlan, HealingAudioPlayerScreen, SessionFeedbackScreen)
// without inventing a parallel session engine.
function createCategoryAnalysis(category: PauseCategory): EmotionalAnalysis {
  const chakra = chakraMap[category.chakraId];
  return {
    summary: `A short pause focused on ${category.label.toLowerCase()}.`,
    keyIncidents: [],
    emotions: [{ name: category.label, intensity: 6, level: "medium" }],
    triggers: [],
    chakraAssociations: [
      {
        chakra: category.chakraId,
        emotionalTheme: chakra.meaning,
        reason: category.tagline,
        sessionSupport: `Your pause will use ${chakra.name} sound to support ${chakra.meaning.toLowerCase()}.`,
        confidence: 1,
      },
    ],
    healingApproachSummary: category.tagline,
    suggestedOutcome: category.tagline,
    recommendedDuration: 10,
    safetyFlag: false,
    analysisSource: "fallback",
  };
}

// Starts a Quick Pause for a Home-tab category: creates a lightweight,
// non-journaled entry (saveMode "reset_only", matching its existing
// "temporary, no journaling intended" semantics) and an immediately-ready
// plan, so the Pause Detail screen's "Start Pause" button can jump straight
// into the existing player. Returns the plan id to route to
// `/healing/player?plan=<id>`, or null if the category id is invalid.
export function startQuickPause(categoryId: PauseCategoryId, durationMinutes = 10) {
  const category = pauseCategoryMap[categoryId];
  if (!category) return null;

  const entry = createJournalEntry({
    rawText: `Quick Pause: ${category.label}`,
    saveMode: "reset_only",
    emotionalIntensityBefore: 6,
  });
  const analysis = createCategoryAnalysis(category);
  saveAnalysis(entry.id, analysis);
  return savePlan(entry.id, durationMinutes, {
    duration: durationMinutes,
    voiceGuidanceLevel: "balanced",
    musicStyle: "ambient",
    affirmationsEnabled: true,
    natureSound: "none",
    guidanceFrequency: "occasional",
  });
}

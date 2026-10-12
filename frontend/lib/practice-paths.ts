import { chakraMap, chakras } from "@/data/chakras";
import { getSessionKey, isChakraComplete, isChakraUnlocked } from "@/lib/progress";
import type { ChakraId, ProgressState } from "@/lib/types";

// Practice Paths reuse the existing 7-chakra structured session engine
// (lib/progress.ts, data/chakras.ts) as-is: ChakraId stays the internal
// identifier and path id, only the user-facing label/description are
// renamed here.
//
// docs/PRODUCT_ROADMAP.md #4 calls for covering all 10 FOUNDATION.md
// "Long-Term Growth" skills. There are 7 chakras and 10 skills, and
// completion is tracked per chakraId+sessionId (lib/progress.ts) — so two
// skills sharing a chakra would be practiced through the literal same
// sessions and the literal same progress, not two independently trackable
// journeys. Rather than either (a) pretending they're separate when
// they'd secretly share progress, or (b) rebuilding the progress engine to
// key by skill instead of chakra, each chakra hosting two skills is named
// as ONE combined path that's honest about building both — traditional
// chakra frameworks already treat one energy center as governing multiple
// qualities, so this isn't a stretch. All 10 named skills appear somewhere
// below; none are silently dropped.
export const practicePathLabels: Record<ChakraId, { label: string; tagline: string; skills: string[] }> = {
  root: { label: "Self Trust & Resilience", tagline: "Build a steady foundation you can rely on, even under pressure", skills: ["Self Trust", "Resilience"] },
  sacral: { label: "Creative Flow & Emotional Recovery", tagline: "Release what feels stuck and let feeling move again", skills: ["Creative Flow", "Emotional Recovery"] },
  "solar-plexus": { label: "Confidence & Emotional Regulation", tagline: "Build courage, steady willpower and self belief", skills: ["Confidence", "Emotional Regulation"] },
  heart: { label: "Letting Go & Self Compassion", tagline: "Soften, forgive, and meet yourself with kindness", skills: ["Letting Go", "Self Compassion"] },
  throat: { label: "Find Your Voice", tagline: "Express yourself clearly and honestly", skills: ["Find Your Voice"] },
  "third-eye": { label: "Uncertainty & Focus", tagline: "Find clarity when the way forward is unclear", skills: ["Uncertainty", "Focus"] },
  crown: { label: "Presence & Rest", tagline: "Quiet the mind, rest fully, and stay present", skills: ["Presence", "Rest & Sleep"] },
};

// One honest sentence per chakra distinguishing traditional inspiration
// from modern interpretation, per FOUNDATION.md's "Traditional Practices"
// section — shown in the collapsed/expandable chakra-inspiration tag.
export const chakraTraditionNotes: Record<ChakraId, string> = {
  root: "In traditional yoga systems, the Root chakra is associated with safety, stability and belonging. Inner Pause borrows this as an optional lens for grounding practices, not a belief you need to hold.",
  sacral: "Traditionally linked to creativity, flow and emotional release, the Sacral chakra inspires this path's focus on letting feeling move rather than stay stuck.",
  "solar-plexus": "The Solar Plexus is traditionally associated with willpower and personal power. Inner Pause uses this as inspiration for confidence and self-regulation practices, not as a claim about energy fields.",
  heart: "In traditional systems, the Heart chakra represents compassion and connection. These sessions draw on that theme for practices in kindness and release — you don't need to believe in chakras for them to help.",
  throat: "The Throat chakra is traditionally tied to expression and honest communication, which inspires this path's focus on finding your voice.",
  "third-eye": "Traditionally associated with insight and intuition, the Third Eye chakra inspires this path's focus on clarity and concentration.",
  crown: "The Crown chakra traditionally represents presence, spaciousness and peace — the inspiration for this path's focus on rest and being present, not a spiritual requirement.",
};

export const practicePaths = chakras.map((chakra) => ({
  id: chakra.id,
  chakra,
  ...practicePathLabels[chakra.id],
}));

export type PracticePath = (typeof practicePaths)[number];

export const practicePathMap: Record<ChakraId, PracticePath> = Object.fromEntries(
  practicePaths.map((path) => [path.id, path]),
) as Record<ChakraId, PracticePath>;

export function isPracticePathId(value: string): value is ChakraId {
  return value in chakraMap;
}

export function getPathCompletedCount(progress: ProgressState, chakraId: ChakraId) {
  const chakra = chakraMap[chakraId];
  return chakra.sessions.filter((session) => progress.completedSessionKeys.includes(getSessionKey(chakraId, session.id))).length;
}

export type PathStatus = "locked" | "not-started" | "in-progress" | "completed";

export function getPathStatus(progress: ProgressState, chakraId: ChakraId): PathStatus {
  const chakra = chakraMap[chakraId];
  if (!isChakraUnlocked(progress, chakra.index)) return "locked";
  if (isChakraComplete(progress, chakraId)) return "completed";
  return getPathCompletedCount(progress, chakraId) > 0 ? "in-progress" : "not-started";
}

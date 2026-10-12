import { chakraMap } from "@/data/chakras";
import { ChakraId } from "@/lib/types";
import { EmotionalAnalysis, HealingPlan, HealingPlanCustomisation, HealingPlanBlock, JournalEntry } from "@/lib/mvp-types";

export { createFallbackAnalysis } from "@inner-pause/shared";

export const defaultPlanCustomisation: HealingPlanCustomisation = {
  duration: "full",
  voiceGuidanceLevel: "balanced",
  musicStyle: "ambient",
  affirmationsEnabled: true,
  natureSound: "none",
  guidanceFrequency: "occasional",
};

const id = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createHealingPlan(entry: JournalEntry, analysis: EmotionalAnalysis, selectedDuration: number | "full" = "full", customisation?: Partial<HealingPlanCustomisation>): HealingPlan {
  const settings: HealingPlanCustomisation = {
    ...defaultPlanCustomisation,
    ...(entry.plan?.customisation ?? {}),
    ...(customisation ?? {}),
    duration: selectedDuration,
  };
  const selectedChakras = selectChakrasForDuration(analysis.chakraAssociations.map((item) => item.chakra), selectedDuration, analysis.recommendedDuration);
  const baseDuration = selectedDuration === "full" ? analysis.recommendedDuration : selectedDuration;
  const blocks = buildPlanBlocks(selectedChakras, analysis, baseDuration, settings);

  return {
    id: entry.plan?.id ?? id(),
    journalEntryId: entry.id,
    title: "Personalised Reset",
    intendedOutcome: analysis.suggestedOutcome,
    totalDurationMinutes: blocks.reduce((sum, block) => sum + block.durationMinutes, 0),
    selectedDuration,
    customisation: settings,
    blocks,
    createdAt: entry.plan?.createdAt ?? new Date().toISOString(),
    status: entry.plan?.status ?? "draft",
    lastPlaybackPosition: entry.plan?.lastPlaybackPosition ?? { blockIndex: 0, elapsedSeconds: 0 },
  };
}

function selectChakrasForDuration(chakras: ChakraId[], selectedDuration: number | "full", recommendedDuration: number) {
  const unique = [...new Set(chakras.length ? chakras : ["heart" as ChakraId])];
  const duration = selectedDuration === "full" ? recommendedDuration : selectedDuration;
  const count = duration <= 5 ? 1 : duration <= 10 ? Math.min(2, unique.length) : duration <= 20 ? Math.min(2, unique.length) : duration <= 30 ? Math.min(3, unique.length) : Math.min(4, unique.length);
  return unique.slice(0, Math.max(1, count));
}

function buildPlanBlocks(chakras: ChakraId[], analysis: EmotionalAnalysis, totalMinutes: number, settings: HealingPlanCustomisation): HealingPlanBlock[] {
  const includeIntro = settings.voiceGuidanceLevel === "minimal" || settings.voiceGuidanceLevel === "balanced" || settings.voiceGuidanceLevel === "guided";
  const includeGuidance = settings.voiceGuidanceLevel === "balanced" || settings.voiceGuidanceLevel === "guided";
  const includeAffirmations = settings.affirmationsEnabled && settings.voiceGuidanceLevel === "guided";
  const includeClosing = settings.voiceGuidanceLevel !== "none";

  const shellBlocks: Array<Omit<HealingPlanBlock, "durationMinutes">> = [];
  const primary = chakraMap[chakras[0]];
  if (includeIntro) {
    shellBlocks.push({
      id: id(),
      type: "intro",
      chakraId: primary.id,
      title: settings.voiceGuidanceLevel === "minimal" ? "Short Arrival" : "Guided Arrival",
      intention: "Arrive slowly and set the tone for the session.",
      audioPath: primary.audioPath,
      frequencyLabel: primary.frequencyLabel,
      guidanceText: "Begin by noticing your breath and letting the body know it can soften.",
    });
  }

  chakras.forEach((chakraId, index) => {
    const chakra = chakraMap[chakraId];
    shellBlocks.push({
      id: id(),
      type: "chakra",
      chakraId,
      title:
        index === 0
          ? "Ground & Release"
          : index === chakras.length - 1
            ? "Calm & Integrate"
            : index === 1
              ? "Rebalance & Empower"
              : "Express & Align",
      intention: index === 0 ? analysis.suggestedOutcome : chakra.purpose,
      audioPath: chakra.audioPath,
      frequencyLabel: chakra.frequencyLabel,
      guidanceText: chakra.purpose,
    });
    if (includeGuidance && settings.guidanceFrequency !== "opening-only") {
      shellBlocks.push({
        id: id(),
        type: "guidance",
        chakraId,
        title: "Gentle Cue",
        intention: chakra.purpose,
        audioPath: chakra.audioPath,
        frequencyLabel: chakra.frequencyLabel,
        guidanceText: settings.guidanceFrequency === "regular" ? `Return to ${chakra.name.toLowerCase()} awareness and breathe into this theme.` : "Take one slow breath and let your attention settle.",
      });
    }
  });

  if (includeAffirmations) {
    shellBlocks.push({
      id: id(),
      type: "affirmation",
      chakraId: primary.id,
      title: "Affirmation Reset",
      intention: primary.affirmations[0],
      audioPath: primary.audioPath,
      frequencyLabel: primary.frequencyLabel,
      guidanceText: primary.affirmations.join(" "),
    });
  }

  if (includeClosing) {
    shellBlocks.push({
      id: id(),
      type: "closing",
      chakraId: primary.id,
      title: "Closing Integration",
      intention: analysis.healingApproachSummary ?? "Close the session gently and return with steadiness.",
      audioPath: primary.audioPath,
      frequencyLabel: primary.frequencyLabel,
      guidanceText: "Notice what feels even slightly softer, steadier or clearer.",
    });
  }

  const blockMinutes = distributeMinutes(totalMinutes, shellBlocks.length);
  return shellBlocks.map((block, index) => ({ ...block, durationMinutes: blockMinutes[index] }));
}

function distributeMinutes(total: number, count: number) {
  const safeCount = Math.max(1, count);
  const base = Math.max(1, Math.floor(total / safeCount));
  const durations = Array.from({ length: safeCount }, () => base);
  let remaining = total - base * safeCount;
  let index = 0;
  while (remaining > 0) {
    durations[index % durations.length] += 1;
    remaining -= 1;
    index += 1;
  }
  return durations;
}

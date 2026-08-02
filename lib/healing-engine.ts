import { chakraMap } from "@/data/chakras";
import { emotionalAnalysisSchema } from "@/lib/ai-schemas";
import { ChakraId } from "@/lib/types";
import { EmotionalAnalysis, HealingPlan, HealingPlanCustomisation, HealingPlanBlock, JournalEntry } from "@/lib/mvp-types";

const chakraKeywords: Record<ChakraId, string[]> = {
  root: ["fear", "unsafe", "money", "finance", "unstable", "restless", "security", "rent"],
  sacral: ["guilt", "numb", "relationship", "creative", "pleasure", "stuck", "attachment", "unable to enjoy", "enjoy anything"],
  "solar-plexus": ["confidence", "shame", "powerless", "failure", "procrastinate", "pressure", "deadline"],
  heart: ["grief", "rejected", "lonely", "resent", "relationship", "hurt", "love", "family", "distant"],
  throat: ["speak", "said", "voice", "conversation", "meeting", "express", "truth"],
  "third-eye": ["confused", "overthinking", "clarity", "decision", "trust", "mind"],
  crown: ["meaning", "disconnected", "alone", "empty", "purpose", "spiritual", "emotionally distant"],
};

const safetyWords = ["suicide", "kill myself", "self harm", "end my life", "hurt myself", "danger"];

const emotionRules = [
  { name: "Anxiety", words: ["anxious", "worry", "worried", "stress", "pressure", "panic", "tomorrow"], chakra: "root" as ChakraId, explanation: "There is concern about what may happen next and a need to feel steadier." },
  { name: "Overwhelm", words: ["overwhelmed", "too much", "deadline", "busy"], chakra: "solar-plexus" as ChakraId, explanation: "The situation may feel like more than your system can comfortably hold right now." },
  { name: "Sadness", words: ["sad", "grief", "hurt", "lonely", "distant"], chakra: "heart" as ChakraId, explanation: "There may be a sense of emotional distance, hurt or disconnection." },
  { name: "Frustration", words: ["angry", "annoyed", "resent", "unfair", "ignored"], chakra: "throat" as ChakraId, explanation: "You may have wanted something to be different, heard or expressed." },
  { name: "Self-doubt", words: ["myself", "ashamed", "failure", "quiet", "stayed quiet"], chakra: "solar-plexus" as ChakraId, explanation: "You may be questioning your response or personal strength in the moment." },
  { name: "Confusion", words: ["confused", "unclear", "overthinking"], chakra: "third-eye" as ChakraId, explanation: "Your mind may be trying to make sense of what happened." },
  { name: "Guilt", words: ["guilt", "guilty", "ashamed"], chakra: "sacral" as ChakraId, explanation: "There may be emotional heaviness around what you feel responsible for." },
];

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

export function createFallbackAnalysis(text: string): EmotionalAnalysis {
  const lower = text.toLowerCase();
  const safetyFlag = safetyWords.some((word) => lower.includes(word));
  const matched = emotionRules.filter((rule) => rule.words.some((word) => lower.includes(word)));
  const emotions = (matched.length ? matched : [emotionRules[0], emotionRules[1], emotionRules[3]]).slice(0, 3);

  const chakraScores = new Map<ChakraId, number>();
  for (const rule of matched) chakraScores.set(rule.chakra, (chakraScores.get(rule.chakra) ?? 0) + 2);
  for (const [chakraId, words] of Object.entries(chakraKeywords) as Array<[ChakraId, string[]]>) {
    const hits = words.filter((word) => lower.includes(word)).length;
    if (hits) chakraScores.set(chakraId, (chakraScores.get(chakraId) ?? 0) + hits);
  }

  const topChakras = [...chakraScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([chakraId, score]) => ({
      chakra: chakraId,
      emotionalTheme: chakraMap[chakraId].meaning,
      reason: buildChakraReason(chakraId, lower),
      sessionSupport: buildSessionSupport(chakraId),
      confidence: Math.min(0.85, 0.45 + score * 0.1),
    }));

  const chakraAssociations =
    topChakras.length > 0
      ? topChakras
      : [
          {
            chakra: "heart" as ChakraId,
            emotionalTheme: chakraMap.heart.meaning,
            reason: "Your reflection suggests a need for emotional balance and self-kindness.",
            sessionSupport: buildSessionSupport("heart"),
            confidence: 0.5,
          },
        ];

  return emotionalAnalysisSchema.parse({
    originalEntrySummary: summarizeEntry(text),
    understandingSummary: buildUnderstanding(text, lower),
    summary: safetyFlag
      ? "Your entry includes language that may suggest immediate distress or danger."
      : "Based on what you shared, the strongest themes appear to be emotional pressure, unmet needs and a wish to feel steadier.",
    keyIncidents: splitIncidents(text),
    emotions: emotions.map((emotion, index) => ({
      name: emotion.name,
      intensity: index === 0 ? 8 : index === 1 ? 6 : 4,
      level: index === 0 ? "high" : index === 1 ? "medium" : "low",
      explanation: emotion.explanation,
      evidence: `Detected from words and context related to ${emotion.words[0]}.`,
    })),
    triggers: inferTriggers(lower),
    chakraAssociations,
    healingApproachSummary: buildHealingApproach(chakraAssociations.map((item) => item.chakra)),
    suggestedOutcome: safetyFlag
      ? "Pause and seek immediate human support before using a normal relaxation session."
      : "Feel more grounded, emotionally clear and able to rest.",
    recommendedDuration: safetyFlag ? 5 : chakraAssociations.length >= 3 ? 30 : 20,
    safetyFlag,
    analysisSource: "fallback",
  });
}

function summarizeEntry(text: string) {
  return text.length > 240 ? `${text.slice(0, 237).trim()}...` : text;
}

function buildUnderstanding(text: string, lower: string) {
  if (lower.includes("ignored") && lower.includes("meeting")) {
    return "It sounds like you felt overlooked in an important work situation and held back what you wanted to say. This may have left frustration toward yourself and worry about what happens next.";
  }
  if (lower.includes("peaceful") && lower.includes("family") && (lower.includes("distant") || lower.includes("unable to enjoy"))) {
    return "Based on what you shared, the day may have been calm on the outside while you still felt emotionally distant inside. This can make enjoyable moments feel harder to fully receive.";
  }
  return `Based on what you shared, it sounds like ${summarizeEntry(text).replace(/^i\b/i, "you")} This may point to emotions that need a slower, gentler reset.`;
}

function buildChakraReason(chakraId: ChakraId, lower: string) {
  if (chakraId === "throat") return "You wanted expression, clarity or acknowledgement, and some words may have stayed unspoken.";
  if (chakraId === "root") return lower.includes("tomorrow") || lower.includes("anxious") ? "Anxiety about what comes next suggests a need for steadiness, safety and grounding." : "Your system may be asking for more steadiness and physical grounding.";
  if (chakraId === "solar-plexus") return "Frustration with yourself or pressure to respond differently may have touched confidence and personal power.";
  if (chakraId === "heart") return "Emotional distance, hurt or tenderness suggests a need for compassion and reconnection.";
  if (chakraId === "sacral") return "Emotional heaviness or stuck feeling may relate to flow, feeling and release.";
  if (chakraId === "third-eye") return "Mental looping or uncertainty suggests a need for clarity and quiet perspective.";
  return "A sense of disconnection or searching for meaning suggests a need for spaciousness and calm presence.";
}

function buildSessionSupport(chakraId: ChakraId) {
  const chakra = chakraMap[chakraId];
  if (chakraId === "throat") return "Your session will use Throat Chakra sound with expression-focused guidance to help release what remained unspoken.";
  if (chakraId === "root") return "Your session will use grounding breathwork and Root Chakra sound to help settle restlessness and create steadiness.";
  if (chakraId === "solar-plexus") return "Your session will use confidence-focused guidance and Solar Plexus sound to support self-trust.";
  if (chakraId === "heart") return "Your session will use Heart Chakra sound and gentle reflection to support emotional softness and reconnection.";
  return `Your session will use ${chakra.name} sound and simple guidance to support ${chakra.meaning.toLowerCase()}.`;
}

function buildHealingApproach(chakras: ChakraId[]) {
  if (chakras.includes("root") && chakras.includes("throat") && chakras.includes("solar-plexus")) {
    return "We will begin by helping you feel grounded, then create space for the words you held back, and close with a confidence-focused reset.";
  }
  if (chakras.includes("heart") && chakras.includes("sacral")) {
    return "We will begin by softening emotional tension, then support gentle reconnection and close with a calm integration.";
  }
  const names = chakras.slice(0, 3).map((chakra) => chakraMap[chakra].name.replace(" Chakra", ""));
  return `We will focus on ${names.join(", ")} themes with calming sound, breath and reflection.`;
}

function splitIncidents(text: string) {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (sentences.length ? sentences : ["A short check-in with your emotional state today."]).map((sentence) => ({
    id: id(),
    text: sentence,
  }));
}

function inferTriggers(lower: string) {
  const triggers = [
    lower.includes("work") || lower.includes("meeting") || lower.includes("deadline") ? "Work pressure" : "",
    lower.includes("money") || lower.includes("finance") ? "Financial worry" : "",
    lower.includes("friend") || lower.includes("family") || lower.includes("relationship") ? "Relationship tension" : "",
    lower.includes("sleep") || lower.includes("tired") ? "Low rest" : "",
  ].filter(Boolean);
  return triggers.length ? triggers : ["Emotional load", "Unresolved thoughts"];
}

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
    title: "Personalised Healing Plan",
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

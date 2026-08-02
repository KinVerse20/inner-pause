import { chakraMap } from "@/data/chakras";
import { emotionalAnalysisSchema } from "@/lib/ai-schemas";
import { ChakraId } from "@/lib/types";
import { EmotionalAnalysis, HealingPlan, JournalEntry } from "@/lib/mvp-types";

const chakraKeywords: Record<ChakraId, string[]> = {
  root: ["fear", "unsafe", "money", "finance", "unstable", "restless", "security", "rent"],
  sacral: ["guilt", "numb", "relationship", "creative", "pleasure", "stuck", "attachment"],
  "solar-plexus": ["confidence", "shame", "powerless", "failure", "procrastinate", "pressure", "deadline"],
  heart: ["grief", "rejected", "lonely", "resent", "relationship", "hurt", "love"],
  throat: ["speak", "said", "voice", "conversation", "meeting", "express", "truth"],
  "third-eye": ["confused", "overthinking", "clarity", "decision", "trust", "mind"],
  crown: ["meaning", "disconnected", "alone", "empty", "purpose", "spiritual"],
};

const safetyWords = ["suicide", "kill myself", "self harm", "end my life", "hurt myself", "danger"];

const emotionRules = [
  { name: "Anxiety", words: ["anxious", "worry", "worried", "stress", "pressure", "panic"], chakra: "root" as ChakraId },
  { name: "Overwhelm", words: ["overwhelmed", "too much", "deadline", "busy"], chakra: "solar-plexus" as ChakraId },
  { name: "Sadness", words: ["sad", "grief", "hurt", "lonely"], chakra: "heart" as ChakraId },
  { name: "Frustration", words: ["angry", "annoyed", "resent", "unfair"], chakra: "throat" as ChakraId },
  { name: "Confusion", words: ["confused", "unclear", "overthinking"], chakra: "third-eye" as ChakraId },
  { name: "Guilt", words: ["guilt", "guilty", "ashamed"], chakra: "sacral" as ChakraId },
];

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
      reason: `This may be connected with traditional ${chakraMap[chakraId].name.toLowerCase()} themes such as ${chakraMap[chakraId].meaning.toLowerCase()}.`,
      confidence: Math.min(0.85, 0.45 + score * 0.1),
    }));

  const chakraAssociations =
    topChakras.length > 0
      ? topChakras
      : [
          {
            chakra: "heart" as ChakraId,
            reason: "This may be connected with emotional balance and self-kindness.",
            confidence: 0.5,
          },
        ];

  return emotionalAnalysisSchema.parse({
    summary: safetyFlag
      ? "Your entry includes language that may suggest immediate distress or danger."
      : "Based on what you shared, the strongest themes appear to be emotional pressure, unmet needs and a wish to feel steadier.",
    keyIncidents: splitIncidents(text),
    emotions: emotions.map((emotion, index) => ({
      name: emotion.name,
      intensity: index === 0 ? 8 : index === 1 ? 6 : 4,
      level: index === 0 ? "high" : index === 1 ? "medium" : "low",
      evidence: `Detected from words and context related to ${emotion.words[0]}.`,
    })),
    triggers: inferTriggers(lower),
    chakraAssociations,
    suggestedOutcome: safetyFlag
      ? "Pause and seek immediate human support before using a normal relaxation session."
      : "Feel more grounded, emotionally clear and able to rest.",
    recommendedDuration: safetyFlag ? 5 : chakraAssociations.length >= 3 ? 30 : 20,
    safetyFlag,
  });
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

export function createHealingPlan(entry: JournalEntry, analysis: EmotionalAnalysis, selectedDuration: number | "full" = "full"): HealingPlan {
  const selectedChakras = analysis.chakraAssociations.slice(0, 4);
  const baseDuration = selectedDuration === "full" ? analysis.recommendedDuration : selectedDuration;
  const blockMinutes = distributeMinutes(baseDuration, selectedChakras.length || 1);
  const blocks = selectedChakras.map((item, index) => {
    const chakra = chakraMap[item.chakra];
    return {
      id: id(),
      chakraId: item.chakra,
      title:
        index === 0
          ? "Ground & Release"
          : index === selectedChakras.length - 1
            ? "Calm & Integrate"
            : index === 1
              ? "Rebalance & Empower"
              : "Express & Align",
      intention: index === 0 ? analysis.suggestedOutcome : chakra.purpose,
      durationMinutes: blockMinutes[index],
      audioPath: chakra.audioPath,
      frequencyLabel: chakra.frequencyLabel,
    };
  });

  return {
    id: id(),
    journalEntryId: entry.id,
    title: "Personalised Healing Plan",
    intendedOutcome: analysis.suggestedOutcome,
    totalDurationMinutes: blocks.reduce((sum, block) => sum + block.durationMinutes, 0),
    selectedDuration,
    blocks,
    createdAt: new Date().toISOString(),
    status: "draft",
    lastPlaybackPosition: { blockIndex: 0, elapsedSeconds: 0 },
  };
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

import { createFallbackAnalysis, emotionalAnalysisSchema } from "@inner-pause/shared";
import { Hono } from "hono";

import { readJsonObject, stringField } from "../http";
import { completeOpenAiJson } from "../openai";

export const analyzeRoutes = new Hono();

analyzeRoutes.post("/", async (c) => {
  let textForFallback = "";
  try {
    const body = await readJsonObject(c);
    const text = stringField(body?.text, 20_000);
    if (!text) {
      return c.json({ error: "Reflection text is required." }, 400);
    }
    textForFallback = text;

    const raw = await completeOpenAiJson(
      [
        "Return only valid JSON matching this emotional wellness schema:",
        "{ summary, originalEntrySummary, understandingSummary, keyIncidents:[{id,text}], emotions:[{name,intensity,level,explanation,evidence}], triggers, chakraAssociations:[{chakra,emotionalTheme,reason,sessionSupport,confidence}], healingApproachSummary, suggestedOutcome, recommendedDuration, safetyFlag, analysisSource }",
        "Allowed chakra values: root, sacral, solar-plexus, heart, throat, third-eye, crown.",
        "Use calm, simple, personalised, non-diagnostic language. Identify chakra associations only as traditional wellness associations.",
        "understandingSummary must connect the incident, internal reaction and emotional impact. It should start with language like 'It sounds like...' or 'Based on what you shared...'.",
        "Each emotion needs a one-sentence explanation specific to the reflection.",
        "Each chakra association needs a short emotionalTheme, a specific reason it may be involved, and how the healing session will support it.",
        "healingApproachSummary should preview the healing sequence in one sentence.",
        "Never claim medical treatment or certainty.",
        `Reflection: ${text}`,
      ].join("\n\n"),
    );

    if (!raw) {
      return c.json({ analysis: createFallbackAnalysis(text), provider: "deterministic_fallback" });
    }

    const parsed = emotionalAnalysisSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return c.json({ analysis: createFallbackAnalysis(text), provider: "deterministic_fallback" });
    }

    return c.json({ analysis: { ...parsed.data, analysisSource: "openai" }, provider: "openai" });
  } catch {
    if (textForFallback) {
      return c.json({ analysis: createFallbackAnalysis(textForFallback), provider: "deterministic_fallback" });
    }
    return c.json({ error: "We could not analyse this entry right now." }, 500);
  }
});

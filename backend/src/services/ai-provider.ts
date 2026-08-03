import type { EmotionalInsight } from "@innerpause/shared";
import { validationError } from "../shared/errors.js";

export interface AiProvider {
  analyseJournal(input: { journalId: string; text: string; requestId: string }): Promise<EmotionalInsight>;
}

export class OpenAiProvider implements AiProvider {
  constructor(private readonly input: { apiKey: string; model: string }) {}

  async analyseJournal(input: { text: string; requestId: string }): Promise<EmotionalInsight> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: {
        authorization: `Bearer ${this.input.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.input.model,
        input: [
          "Return only JSON for a reflective wellness emotional insight.",
          "Shape: {summary, emotions:[{name,intensity,level,explanation}], triggers, suggestedOutcome, recommendedDuration, safetyFlag}.",
          "Use non-medical, calm language. Do not diagnose.",
          `Reflection: ${input.text}`,
        ].join("\n\n"),
        text: { format: { type: "json_object" } },
      }),
    });

    if (!response.ok) throw validationError("AI provider request failed.");
    const payload = (await response.json()) as { output_text?: string };
    const parsed = JSON.parse(payload.output_text ?? "{}") as EmotionalInsight;
    return validateInsight(parsed);
  }
}

export class MockAiProvider implements AiProvider {
  async analyseJournal(input: { text: string }): Promise<EmotionalInsight> {
    return {
      summary: "Mock test insight generated for automated testing only.",
      emotions: [{ name: "Calm reset", intensity: 5, level: "medium", explanation: "Test-only mock output." }],
      triggers: ["Test trigger"],
      suggestedOutcome: "Feel steadier.",
      recommendedDuration: 10,
      safetyFlag: input.text.toLowerCase().includes("self harm"),
    };
  }
}

function validateInsight(input: EmotionalInsight): EmotionalInsight {
  if (!input || typeof input.summary !== "string" || !Array.isArray(input.emotions)) {
    throw validationError("AI provider returned an invalid insight shape.");
  }
  return {
    summary: input.summary,
    emotions: input.emotions,
    triggers: Array.isArray(input.triggers) ? input.triggers : [],
    suggestedOutcome: input.suggestedOutcome,
    recommendedDuration: input.recommendedDuration,
    safetyFlag: Boolean(input.safetyFlag),
  };
}


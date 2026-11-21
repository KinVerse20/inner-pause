import type { BackendConfig } from "../config/env.js";
import { readSecretString } from "../runtime/secrets.js";

export async function createAiQuickAnalysis(input: {
  text: string;
  requestId: string;
  config: BackendConfig;
}) {
  if (input.config.aiMode !== "openai") {
    throw new Error("OpenAI analysis is not enabled.");
  }

  const apiKey =
    input.config.openAiApiKey ??
    (input.config.openAiApiKeySecretArn && input.config.region
      ? await readSecretString({
          region: input.config.region,
          secretArn: input.config.openAiApiKeySecretArn,
          jsonKey: "OPENAI_API_KEY",
        })
      : undefined);

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "x-client-request-id": input.requestId,
    },
    body: JSON.stringify({
      model: input.config.openAiModel,
      input: [
        "You are The Inner Pause reflective wellness guide.",
        "Analyse the user's exact reflection personally and specifically.",
        "Avoid generic statements, diagnosis, medical claims, or invented facts.",
        "Return only valid JSON with this exact shape:",
        JSON.stringify({
          summary: "2-3 specific sentences reflecting the user's situation",
          originalEntrySummary: "brief factual summary of what the user shared",
          understandingSummary: "empathetic interpretation grounded in their words",
          keyIncidents: [{ id: "incident-1", text: "specific incident or concern" }],
          emotions: [
            {
              name: "emotion",
              intensity: 1,
              level: "low|medium|high",
              explanation: "why this emotion is indicated by the reflection",
            },
          ],
          triggers: ["specific likely trigger grounded in the reflection"],
          chakraAssociations: [
            {
              chakra: "root|sacral|solar-plexus|heart|throat|third-eye|crown",
              emotionalTheme: "specific theme",
              reason: "reason grounded in the user's reflection",
              sessionSupport: "specific calming support",
              confidence: 0.75,
            },
          ],
          healingApproachSummary: "personalised, practical reset approach",
          suggestedOutcome: "realistic emotional outcome",
          recommendedDuration: 10,
          safetyFlag: false,
          analysisSource: "openai",
        }),
        "Intensity must be an integer from 1 to 10.",
        "Use one to three emotions and one to three key incidents.",
        `User reflection: ${input.text}`,
      ].join("\n\n"),
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("OpenAI quick analysis failed", {
      requestId: input.requestId,
      status: response.status,
      details: details.slice(0, 500),
    });
    throw new Error("OpenAI could not prepare the emotional insight.");
  }

  const payload = (await response.json()) as OpenAiResponsesPayload;
  const outputText = extractOpenAiOutputText(payload);

  if (!outputText) {
    console.error("OpenAI returned no readable text", {
      requestId: input.requestId,
      responseId: payload.id,
      status: payload.status,
      outputItems: Array.isArray(payload.output) ? payload.output.length : 0,
    });
    throw new Error("OpenAI returned an empty emotional insight.");
  }

  let analysis: Record<string, unknown>;
  try {
    analysis = JSON.parse(outputText) as Record<string, unknown>;
  } catch (error) {
    console.error("OpenAI returned invalid JSON", {
      requestId: input.requestId,
      responseId: payload.id,
      preview: outputText.slice(0, 300),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw new Error("OpenAI returned an invalid emotional insight.");
  }

  if (
    typeof analysis.summary !== "string" ||
    !Array.isArray(analysis.emotions) ||
    typeof analysis.understandingSummary !== "string"
  ) {
    console.error("OpenAI insight shape validation failed", {
      requestId: input.requestId,
      responseId: payload.id,
      keys: Object.keys(analysis),
    });
    throw new Error("OpenAI returned an invalid emotional insight.");
  }

  return {
    ...analysis,
    analysisSource: "openai",
  };
}

interface OpenAiResponsesPayload {
  id?: string;
  status?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
}

function extractOpenAiOutputText(payload: OpenAiResponsesPayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const textParts = (payload.output ?? []).flatMap((item) =>
    (item.content ?? [])
      .filter((content) => content.type === "output_text" && typeof content.text === "string")
      .map((content) => content.text!.trim())
      .filter(Boolean),
  );

  return textParts.join("\n").trim();
}

import { emotionalAnalysisSchema } from "@/lib/ai-schemas";
import { createFallbackAnalysis } from "@/lib/healing-engine";

export async function POST(request: Request) {
  let textForFallback = "";
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();
    if (!text) {
      return Response.json({ error: "Reflection text is required." }, { status: 400 });
    }
    textForFallback = text;

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ analysis: createFallbackAnalysis(text), provider: "deterministic_fallback" });
    }

    const prompt = [
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
    ].join("\n\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(12000),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: prompt,
        text: { format: { type: "json_object" } },
      }),
    });

    if (!response.ok) {
      return Response.json({ analysis: createFallbackAnalysis(text), provider: "deterministic_fallback" });
    }

    const payload = (await response.json()) as { output_text?: string };
    const parsed = emotionalAnalysisSchema.safeParse(JSON.parse(payload.output_text ?? "{}"));
    if (!parsed.success) {
      return Response.json({ analysis: createFallbackAnalysis(text), provider: "deterministic_fallback" });
    }

    return Response.json({ analysis: { ...parsed.data, analysisSource: "openai" }, provider: "openai" });
  } catch {
    if (textForFallback) {
      return Response.json({ analysis: createFallbackAnalysis(textForFallback), provider: "deterministic_fallback" });
    }
    return Response.json({ error: "We could not analyse this entry right now." }, { status: 500 });
  }
}

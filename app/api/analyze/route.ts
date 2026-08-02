import { emotionalAnalysisSchema } from "@/lib/ai-schemas";
import { createFallbackAnalysis } from "@/lib/healing-engine";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim();
    if (!text) {
      return Response.json({ error: "Journal text is required." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ analysis: createFallbackAnalysis(text), provider: "deterministic_fallback" });
    }

    const prompt = [
      "Return only valid JSON matching this emotional wellness schema.",
      "Use calm, simple, non-diagnostic language. Identify chakra associations only as traditional wellness associations.",
      "Never claim medical treatment or certainty.",
      `Journal entry: ${text}`,
    ].join("\n\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
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

    return Response.json({ analysis: parsed.data, provider: "openai" });
  } catch {
    return Response.json({ error: "We could not analyse this entry right now." }, { status: 500 });
  }
}

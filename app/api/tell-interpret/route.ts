import { tellRoutingSchema } from "@/lib/ai-schemas";
import type { BigMomentMode } from "@/lib/big-moment-engine";
import { pauseCategories, type PauseCategoryId } from "@/lib/pause-categories";
import { buildReflection, classifyTellInput } from "@/lib/tell-interpreter";
import type { TellInterpretation } from "@/lib/tell-storage";

// The AI is allowed to be honestly uncertain — a low self-reported
// confidence must still land in the Ambiguous state (docs/PRODUCT_FLOW.md
// §16's three states apply to the AI path too), not get forced into
// "confident" just because the call itself succeeded.
const AI_CONFIDENCE_THRESHOLD = 0.5;

// Leads with the AI's own pick, then fills in from the deterministic
// scorer's ranking (never the AI inventing extra options) so an
// under-confident AI read still offers a small, grounded set, not just one
// isolated guess.
function ambiguousCandidatesFrom(primary: PauseCategoryId, deterministicCandidates: PauseCategoryId[]): PauseCategoryId[] {
  const rest = deterministicCandidates.filter((id) => id !== primary);
  const fallback = pauseCategories.map((category) => category.id).filter((id) => id !== primary && !rest.includes(id));
  return [primary, ...rest, ...fallback].slice(0, 3);
}

const MOMENT_MODE_CONTEXT: Record<BigMomentMode, string> = {
  before: "The user is telling this from Moments, in the 'Coming up' mode: something meaningful is about to happen.",
  during: "The user is telling this from Moments, in the 'Happening now' mode: something meaningful is happening to them right now.",
  after: "The user is telling this from Moments, in the 'Just happened' mode: something meaningful just happened to them.",
};

// Only reached when the client's deterministic scorer (lib/tell-interpreter.ts)
// couldn't confidently resolve a category on its own — AI is used strictly
// for genuinely ambiguous free-form meaning, never for routing known
// categories (docs/PRODUCT_FLOW.md §38). Same shape as the existing
// /api/analyze route: deterministic fallback whenever no API key is
// configured, so this works fully offline in local development.
export async function POST(request: Request) {
  let text = "";
  let chips: string[] = [];
  let momentMode: BigMomentMode | undefined;
  try {
    const body = (await request.json()) as { text?: string; chips?: string[]; momentMode?: BigMomentMode };
    text = body.text?.trim() ?? "";
    chips = Array.isArray(body.chips) ? body.chips : [];
    momentMode = body.momentMode === "before" || body.momentMode === "during" || body.momentMode === "after" ? body.momentMode : undefined;
    if (!text) {
      return Response.json({ error: "Text is required." }, { status: 400 });
    }

    // Same context the client already scored with (lib/tell-interpreter.ts) —
    // this call must not silently drop the Big Moment mode the user was
    // already inside of when they told Inner Pause what was going on.
    const deterministic = classifyTellInput(text, chips, momentMode);

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ result: deterministic });
    }

    const prompt = [
      "Return only valid JSON matching this schema: { pauseCategoryId, confidence, rationale }.",
      "pauseCategoryId must be exactly one of: sleep, reset, focus, confidence, calm, release.",
      "sleep = trouble sleeping/resting. reset = feeling overwhelmed, needs to ground and restart.",
      "focus = distracted, can't concentrate. confidence = nervous about a specific upcoming moment (interview, presentation).",
      "calm = anxious, panicky, racing thoughts, or a diffuse hard-to-name emotional weight (e.g. loneliness, feeling left out, sadness) that mainly needs steadying.",
      "release = angry, hurt, grieving, or needs to let something go, including social/relational pain (e.g. feeling excluded or unwanted) that mainly needs processing.",
      "confidence (number 0-1) reflects how clearly the text matches that category.",
      "rationale is one short, warm sentence explaining the choice, grounded in what the user actually said — never clinical or diagnostic, never generic.",
      "Understand the emotional meaning of what the user wrote even if it uses no keyword from the category descriptions above — infer intent from context, not literal phrase matching.",
      momentMode ? MOMENT_MODE_CONTEXT[momentMode] : "",
      chips.length ? `The user also selected these context chips: ${chips.join(", ")}.` : "",
      `What the user shared: ${text}`,
    ].filter(Boolean).join("\n\n");

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
      return Response.json({ result: deterministic });
    }

    const payload = (await response.json()) as { output_text?: string };
    const parsed = tellRoutingSchema.safeParse(JSON.parse(payload.output_text ?? "{}"));
    if (!parsed.success) {
      return Response.json({ result: deterministic });
    }

    const result: TellInterpretation =
      parsed.data.confidence >= AI_CONFIDENCE_THRESHOLD
        ? {
            status: "confident",
            primary: parsed.data.pauseCategoryId,
            candidates: [parsed.data.pauseCategoryId],
            confidence: parsed.data.confidence,
            method: "ai",
            rationale: parsed.data.rationale,
          }
        : {
            status: "ambiguous",
            primary: parsed.data.pauseCategoryId,
            candidates: ambiguousCandidatesFrom(parsed.data.pauseCategoryId, deterministic.candidates),
            confidence: parsed.data.confidence,
            method: "ai",
            rationale: parsed.data.rationale,
            reflection: buildReflection(text),
          };
    return Response.json({ result });
  } catch {
    if (text) {
      return Response.json({ result: classifyTellInput(text, chips, momentMode) });
    }
    return Response.json({ error: "We could not interpret this entry right now." }, { status: 500 });
  }
}

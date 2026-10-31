import {
  buildReflection,
  classifyTellInput,
  pauseCategoryIds,
  tellRoutingSchema,
  type BigMomentMode,
  type PauseCategoryId,
  type TellInterpretation,
} from "@inner-pause/shared";
import { Hono } from "hono";

import { readJsonObject, stringField } from "../http";
import { completeOpenAiJson } from "../openai";

const AI_CONFIDENCE_THRESHOLD = 0.5;

function ambiguousCandidatesFrom(primary: PauseCategoryId, deterministicCandidates: PauseCategoryId[]): PauseCategoryId[] {
  const rest = deterministicCandidates.filter((id) => id !== primary);
  const fallback = pauseCategoryIds.filter((id) => id !== primary && !rest.includes(id));
  return [primary, ...rest, ...fallback].slice(0, 3);
}

const MOMENT_MODE_CONTEXT: Record<BigMomentMode, string> = {
  before: "The user is telling this from Moments, in the 'Coming up' mode: something meaningful is about to happen.",
  during: "The user is telling this from Moments, in the 'Happening now' mode: something meaningful is happening to them right now.",
  after: "The user is telling this from Moments, in the 'Just happened' mode: something meaningful just happened to them.",
};

function parseMomentMode(value: unknown): BigMomentMode | undefined {
  return value === "before" || value === "during" || value === "after" ? value : undefined;
}

export const tellRoutes = new Hono();

tellRoutes.post("/", async (c) => {
  let text = "";
  let chips: string[] = [];
  let momentMode: BigMomentMode | undefined;
  try {
    const body = await readJsonObject(c);
    text = stringField(body?.text, 20_000);
    // Only short text chips; anything else would break classification.
    chips = Array.isArray(body?.chips)
      ? body.chips.filter((chip): chip is string => typeof chip === "string").map((chip) => chip.trim().slice(0, 60)).filter(Boolean).slice(0, 12)
      : [];
    momentMode = parseMomentMode(body?.momentMode);
    if (!text) {
      return c.json({ error: "Text is required." }, 400);
    }

    const deterministic = classifyTellInput(text, chips, momentMode);

    const raw = await completeOpenAiJson(
      [
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
      ]
        .filter(Boolean)
        .join("\n\n"),
    );

    if (!raw) {
      return c.json({ result: deterministic });
    }

    const parsed = tellRoutingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return c.json({ result: deterministic });
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
    return c.json({ result });
  } catch {
    if (text) {
      return c.json({ result: classifyTellInput(text, chips, momentMode) });
    }
    return c.json({ error: "We could not interpret this entry right now." }, 500);
  }
});

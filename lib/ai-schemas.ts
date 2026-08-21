import { z } from "zod";

export const emotionalAnalysisSchema = z.object({
  summary: z.string().min(1),
  originalEntrySummary: z.string().min(1).optional(),
  understandingSummary: z.string().min(1).optional(),
  keyIncidents: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(1),
  emotions: z
    .array(
      z.object({
        name: z.string().min(1),
        intensity: z.number().min(1).max(10),
        level: z.enum(["low", "medium", "high"]),
        explanation: z.string().min(1).optional(),
        evidence: z.string().optional(),
      }),
    )
    .min(1),
  triggers: z.array(z.string()),
  chakraAssociations: z
    .array(
      z.object({
        chakra: z.enum(["root", "sacral", "solar-plexus", "heart", "throat", "third-eye", "crown"]),
        emotionalTheme: z.string().min(1).optional(),
        reason: z.string().min(1),
        sessionSupport: z.string().min(1).optional(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1),
  healingApproachSummary: z.string().min(1).optional(),
  suggestedOutcome: z.string().min(1),
  recommendedDuration: z.number().min(5).max(60),
  safetyFlag: z.boolean(),
  analysisSource: z.enum(["openai", "fallback"]).optional(),
});

export type EmotionalAnalysisSchema = z.infer<typeof emotionalAnalysisSchema>;

// Tell Inner Pause routing (docs/TECHNICAL_ARCHITECTURE.md §9) — deliberately
// minimal compared to emotionalAnalysisSchema above: the only job here is
// picking one of the six Right Now outcomes for genuinely ambiguous free
// text, not a full emotional analysis.
export const tellRoutingSchema = z.object({
  pauseCategoryId: z.enum(["sleep", "reset", "focus", "confidence", "calm", "release"]),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
});

export type TellRoutingSchema = z.infer<typeof tellRoutingSchema>;

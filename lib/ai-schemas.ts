import { z } from "zod";

export const emotionalAnalysisSchema = z.object({
  summary: z.string().min(1),
  keyIncidents: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(1),
  emotions: z
    .array(
      z.object({
        name: z.string().min(1),
        intensity: z.number().min(1).max(10),
        level: z.enum(["low", "medium", "high"]),
        evidence: z.string().optional(),
      }),
    )
    .min(1),
  triggers: z.array(z.string()),
  chakraAssociations: z
    .array(
      z.object({
        chakra: z.enum(["root", "sacral", "solar-plexus", "heart", "throat", "third-eye", "crown"]),
        reason: z.string().min(1),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1),
  suggestedOutcome: z.string().min(1),
  recommendedDuration: z.number().min(5).max(60),
  safetyFlag: z.boolean(),
});

export type EmotionalAnalysisSchema = z.infer<typeof emotionalAnalysisSchema>;

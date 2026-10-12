import type { PauseCategoryId } from "./pause-categories";

export type BigMomentMode = "before" | "during" | "after";

export type TellInterpretationStatus = "confident" | "ambiguous" | "unclear";
export type TellInterpretationMethod = "deterministic" | "ai";

export interface TellInterpretation {
  status: TellInterpretationStatus;
  primary: PauseCategoryId | null;
  candidates: PauseCategoryId[];
  confidence: number;
  method: TellInterpretationMethod;
  rationale: string;
  reflection?: string;
}

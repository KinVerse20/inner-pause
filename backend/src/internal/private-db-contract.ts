import type { EmotionalInsight } from "@innerpause/shared";
import type { AuthenticatedUser } from "../auth/cognito.js";

export type PrivateDbRequest =
  | {
      action: "createAnalysisJob";
      authenticatedUser: AuthenticatedUser;
      journalId: string;
      requestId: string;
      idempotencyKey?: string;
    }
  | {
      action: "createAudioJob";
      authenticatedUser: AuthenticatedUser;
      journalId: string;
      requestId: string;
      idempotencyKey?: string;
    }
  | {
      action: "persistAnalysisResult";
      userId: string;
      journalId: string;
      jobId: string;
      insight: EmotionalInsight;
    }
  | {
      action: "failJob";
      userId: string;
      jobId: string;
      errorMessage: string;
    };

export interface PrivateDbActionResult {
  jobId?: string;
  status?: string;
  userId?: string;
  journalId?: string;
  journalText?: string;
}

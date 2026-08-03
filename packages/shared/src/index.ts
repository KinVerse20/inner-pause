export type ApiVersion = "v1";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE_REQUEST"
  | "JOB_FAILED"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiSuccess<T> {
  data: T;
  requestId: string;
}

export type EmotionLevel = "low" | "medium" | "high";
export type JobStatus = "queued" | "running" | "completed" | "failed";
export type JobType = "journal_analysis" | "reset_audio";

export interface CurrentUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface JournalSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  emotionalIntensityBefore?: number;
  hasAnalysis: boolean;
  hasResetAudio: boolean;
}

export interface JournalDetail extends JournalSummary {
  rawText: string;
  transcription?: string;
  analysis?: EmotionalInsight;
}

export interface EmotionalInsight {
  summary: string;
  emotions: Array<{
    name: string;
    intensity: number;
    level: EmotionLevel;
    explanation?: string;
  }>;
  triggers: string[];
  suggestedOutcome?: string;
  recommendedDuration?: number;
  safetyFlag: boolean;
}

export interface CreateJournalRequest {
  rawText: string;
  title?: string;
  transcription?: string;
  emotionalIntensityBefore?: number;
  idempotencyKey?: string;
}

export interface CreateJournalResponse {
  journal: JournalDetail;
}

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobStatusResponse {
  jobId: string;
  type: JobType;
  status: JobStatus;
  resultId?: string;
  errorMessage?: string;
}

export interface AudioRecord {
  id: string;
  journalId?: string;
  title: string;
  durationSeconds: number;
  playbackUrl: string;
  expiresAt: string;
}

export interface InsightSummary {
  journalCount: number;
  recurringEmotions: string[];
  latestReflectionAt?: string;
}

export interface NotificationMessage {
  id: string;
  messageText: string;
  deliveryChannel: "mock" | "meta_whatsapp" | "twilio";
  deliveryStatus: "queued" | "sent" | "failed" | "mock_created";
  createdAt: string;
}


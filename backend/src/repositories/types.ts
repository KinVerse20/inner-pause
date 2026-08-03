import type { AudioRecord, JournalDetail, JournalSummary, NotificationMessage } from "@innerpause/shared";

export interface CreateJournalInput {
  title: string;
  rawText: string;
  transcription?: string;
  emotionalIntensityBefore?: number;
}

export interface CreateAudioInput extends Omit<AudioRecord, "id"> {
  objectKey?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface AppRepository {
  ensureUser(input: { providerSubject: string; email: string; fullName?: string }): Promise<{ id: string; email: string; fullName?: string }>;
  createJournal(userId: string, input: CreateJournalInput): Promise<JournalDetail>;
  listJournals(userId: string): Promise<JournalSummary[]>;
  getJournalForUser(userId: string, journalId: string): Promise<JournalDetail>;
  deleteJournalForUser(userId: string, journalId: string): Promise<void>;
  rememberJob(idempotencyKey: string | undefined, userId: string, jobId: string): Promise<void>;
  findJobByIdempotency(idempotencyKey: string | undefined, userId: string): Promise<{ jobId: string; userId: string } | null>;
  createJob(input: { userId: string; type: "journal_analysis" | "reset_audio"; status: string; journalId?: string; idempotencyKey?: string }): Promise<{ jobId: string }>;
  updateJob(input: { userId: string; jobId: string; status: string; resultId?: string; errorMessage?: string }): Promise<void>;
  getJobForUser(userId: string, jobId: string): Promise<{ jobId: string; type: "journal_analysis" | "reset_audio"; status: string; resultId?: string; errorMessage?: string }>;
  createAudio(userId: string, input: CreateAudioInput): Promise<AudioRecord>;
  getAudioForUser(userId: string, audioId: string): Promise<AudioRecord & { objectKey?: string }>;
  deleteAudioForUser(userId: string, audioId: string): Promise<void>;
  listNotifications(userId: string): Promise<NotificationMessage[]>;
}


import type { AudioRecord, EmotionalInsight, JournalDetail, JournalSummary, NotificationMessage } from "@innerpause/shared";

export interface UserPreferences {
  timezone?: string;
  onboardingCompleted?: boolean;
  preferredSessionDuration?: number;
  preferredVoice?: string;
  preferredMusicStyle?: string;
  preferredGuidanceLevel?: string;
  affirmationsEnabled?: boolean;
  natureSoundsEnabled?: boolean;
}

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

export interface PracticePushInput {
  issueId: "anxiety" | "confidence" | "focus" | "reactivity" | "sleep";
  reminderTime: string;
  timezone: string;
  subscription: { endpoint: string; keys?: { p256dh?: string; auth?: string } };
  userAgent?: string;
}

export interface DuePracticeReminder {
  practiceId: string;
  localDate: string;
  issueId: PracticePushInput['issueId'];
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface AppRepository {
  saveJourney(userId: string, journey: import('../../../packages/shared/src/journey.js').SavedJourney): Promise<void>;
  getJourney(userId: string, id: string): Promise<import('../../../packages/shared/src/journey.js').SavedJourney>;
  listJourneys(userId: string): Promise<import('../../../packages/shared/src/journey.js').SavedJourney[]>;
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
  saveAnalysis(userId: string, journalId: string, insight: EmotionalInsight, modelVersion?: string): Promise<{ analysisId: string }>;
  createAudio(userId: string, input: CreateAudioInput): Promise<AudioRecord>;
  getAudioForUser(userId: string, audioId: string): Promise<AudioRecord & { objectKey?: string }>;
  deleteAudioForUser(userId: string, audioId: string): Promise<void>;
  getPreferences(userId: string): Promise<UserPreferences>;
  updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
  listNotifications(userId: string): Promise<NotificationMessage[]>;
  createNotification(input: {
    userId: string;
    messageText: string;
    deliveryChannel: NotificationMessage["deliveryChannel"];
    deliveryStatus: NotificationMessage["deliveryStatus"];
    idempotencyKey?: string;
    scheduledFor?: string;
    providerMessageId?: string;
    errorMessage?: string;
  }): Promise<NotificationMessage>;
  savePracticePushSubscription(userId: string, input: PracticePushInput): Promise<{ practiceId: string; subscribed: true }>;
  listDuePracticePushReminders(): Promise<DuePracticeReminder[]>;
  markPracticeReminderSent(practiceId: string, localDate: string): Promise<void>;
}

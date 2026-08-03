import type { AudioRecord, EmotionalInsight, JournalDetail, NotificationMessage } from "@innerpause/shared";
import { forbidden, notFound } from "../shared/errors.js";
import type { AppRepository, CreateAudioInput, CreateJournalInput, UserPreferences } from "./types.js";

export class InMemoryRepository implements AppRepository {
  private journals = new Map<string, JournalDetail & { userId: string }>();
  private audio = new Map<string, AudioRecord & { userId: string }>();
  private notifications = new Map<string, NotificationMessage & { userId: string }>();
  private preferences = new Map<string, UserPreferences>();
  private jobs = new Map<string, { userId: string; jobId: string; type: "journal_analysis" | "reset_audio"; status: string; resultId?: string; errorMessage?: string }>();
  private jobsByIdempotency = new Map<string, { jobId: string; userId: string }>();

  async ensureUser(input: { providerSubject: string; email: string; fullName?: string }) {
    return { id: input.providerSubject, email: input.email, fullName: input.fullName };
  }

  async createJournal(userId: string, input: CreateJournalInput) {
    const now = new Date().toISOString();
    const journal: JournalDetail & { userId: string } = {
      id: crypto.randomUUID(),
      userId,
      title: input.title,
      rawText: input.rawText,
      transcription: input.transcription,
      emotionalIntensityBefore: input.emotionalIntensityBefore,
      createdAt: now,
      updatedAt: now,
      hasAnalysis: false,
      hasResetAudio: false,
    };
    this.journals.set(journal.id, journal);
    return journal;
  }

  async listJournals(userId: string) {
    return [...this.journals.values()]
      .filter((journal) => journal.userId === userId)
      .map((journal) => ({
        id: journal.id,
        title: journal.title,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt,
        emotionalIntensityBefore: journal.emotionalIntensityBefore,
        hasAnalysis: journal.hasAnalysis,
        hasResetAudio: journal.hasResetAudio,
      }));
  }

  async getJournalForUser(userId: string, journalId: string) {
    const journal = this.journals.get(journalId);
    if (!journal) throw notFound("Journal");
    if (journal.userId !== userId) throw forbidden();
    return {
      id: journal.id,
      title: journal.title,
      rawText: journal.rawText,
      transcription: journal.transcription,
      emotionalIntensityBefore: journal.emotionalIntensityBefore,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
      hasAnalysis: journal.hasAnalysis,
      hasResetAudio: journal.hasResetAudio,
      analysis: journal.analysis,
    };
  }

  async deleteJournalForUser(userId: string, journalId: string) {
    await this.getJournalForUser(userId, journalId);
    this.journals.delete(journalId);
  }

  async rememberJob(idempotencyKey: string | undefined, userId: string, jobId: string) {
    if (!idempotencyKey) return;
    this.jobsByIdempotency.set(`${userId}:${idempotencyKey}`, { userId, jobId });
  }

  async findJobByIdempotency(idempotencyKey: string | undefined, userId: string) {
    if (!idempotencyKey) return null;
    return this.jobsByIdempotency.get(`${userId}:${idempotencyKey}`) ?? null;
  }

  async createJob(input: { userId: string; type: "journal_analysis" | "reset_audio"; status: string; journalId?: string; idempotencyKey?: string }) {
    const jobId = crypto.randomUUID();
    this.jobs.set(jobId, { userId: input.userId, jobId, type: input.type, status: input.status });
    await this.rememberJob(input.idempotencyKey, input.userId, jobId);
    return { jobId };
  }

  async updateJob(input: { userId: string; jobId: string; status: string; resultId?: string; errorMessage?: string }) {
    const job = this.jobs.get(input.jobId);
    if (!job) throw notFound("Job");
    if (job.userId !== input.userId) throw forbidden();
    this.jobs.set(input.jobId, { ...job, status: input.status, resultId: input.resultId, errorMessage: input.errorMessage });
  }

  async getJobForUser(userId: string, jobId: string): Promise<{ jobId: string; type: "journal_analysis" | "reset_audio"; status: string; resultId?: string; errorMessage?: string }> {
    const job = this.jobs.get(jobId);
    if (!job) throw notFound("Job");
    if (job.userId !== userId) throw forbidden();
    return { jobId: job.jobId, type: job.type, status: job.status, resultId: job.resultId, errorMessage: job.errorMessage };
  }

  async saveAnalysis(userId: string, journalId: string, insight: EmotionalInsight): Promise<{ analysisId: string }> {
    const journal = this.journals.get(journalId);
    if (!journal) throw notFound("Journal");
    if (journal.userId !== userId) throw forbidden();
    journal.analysis = {
      summary: insight.summary,
      emotions: insight.emotions,
      triggers: insight.triggers,
      suggestedOutcome: insight.suggestedOutcome ?? "Feel more settled.",
      recommendedDuration: insight.recommendedDuration ?? 10,
      safetyFlag: insight.safetyFlag,
    };
    journal.hasAnalysis = true;
    return { analysisId: crypto.randomUUID() };
  }

  async createAudio(userId: string, input: CreateAudioInput) {
    const record: AudioRecord & { userId: string } = { id: crypto.randomUUID(), userId, ...input };
    this.audio.set(record.id, record);
    if (input.journalId) {
      const journal = this.journals.get(input.journalId);
      if (journal && journal.userId === userId) journal.hasResetAudio = true;
    }
    return record;
  }

  async getAudioForUser(userId: string, audioId: string) {
    const record = this.audio.get(audioId);
    if (!record) throw notFound("Audio");
    if (record.userId !== userId) throw forbidden();
    return {
      id: record.id,
      journalId: record.journalId,
      title: record.title,
      durationSeconds: record.durationSeconds,
      playbackUrl: record.playbackUrl,
      expiresAt: record.expiresAt,
    };
  }

  async deleteAudioForUser(userId: string, audioId: string) {
    await this.getAudioForUser(userId, audioId);
    this.audio.delete(audioId);
  }

  async getPreferences(userId: string) {
    return this.preferences.get(userId) ?? {};
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>) {
    const next = { ...(this.preferences.get(userId) ?? {}), ...preferences };
    this.preferences.set(userId, next);
    return next;
  }

  async listNotifications(userId: string) {
    return [...this.notifications.values()]
      .filter((message) => message.userId === userId)
      .map((message) => ({
        id: message.id,
        messageText: message.messageText,
        deliveryChannel: message.deliveryChannel,
        deliveryStatus: message.deliveryStatus,
        createdAt: message.createdAt,
      }));
  }

  async createNotification(input: {
    userId: string;
    messageText: string;
    deliveryChannel: NotificationMessage["deliveryChannel"];
    deliveryStatus: NotificationMessage["deliveryStatus"];
    idempotencyKey?: string;
    scheduledFor?: string;
    providerMessageId?: string;
    errorMessage?: string;
  }) {
    const message: NotificationMessage & { userId: string } = {
      id: crypto.randomUUID(),
      userId: input.userId,
      messageText: input.messageText,
      deliveryChannel: input.deliveryChannel,
      deliveryStatus: input.deliveryStatus,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(message.id, message);
    return {
      id: message.id,
      messageText: message.messageText,
      deliveryChannel: message.deliveryChannel,
      deliveryStatus: message.deliveryStatus,
      createdAt: message.createdAt,
    };
  }
}

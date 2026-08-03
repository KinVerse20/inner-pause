import type { AudioRecord, JournalDetail, NotificationMessage } from "@innerpause/shared";
import { forbidden, notFound } from "../shared/errors.js";
import type { AppRepository, CreateAudioInput, CreateJournalInput } from "./types.js";

export class InMemoryRepository implements AppRepository {
  private journals = new Map<string, JournalDetail & { userId: string }>();
  private audio = new Map<string, AudioRecord & { userId: string }>();
  private notifications = new Map<string, NotificationMessage & { userId: string }>();
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
    await this.rememberJob(input.idempotencyKey, input.userId, jobId);
    return { jobId };
  }

  async updateJob() {
    return;
  }

  async getJobForUser(): Promise<{ jobId: string; type: "journal_analysis"; status: string }> {
    throw notFound("Job");
  }

  async createAudio(userId: string, input: CreateAudioInput) {
    const record: AudioRecord & { userId: string } = { id: crypto.randomUUID(), userId, ...input };
    this.audio.set(record.id, record);
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
}

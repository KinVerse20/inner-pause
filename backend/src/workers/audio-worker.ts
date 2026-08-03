import type { AppRepository } from "../repositories/types.js";
import type { AudioProvider } from "../services/audio-provider.js";
import { S3PrivateStorage } from "../storage/s3-storage.js";

export class AudioWorker {
  constructor(
    private readonly repository: AppRepository,
    private readonly audioProvider: AudioProvider,
    private readonly storage: S3PrivateStorage,
  ) {}

  async process(input: { userId: string; jobId: string; journalId: string }) {
    await this.repository.updateJob({ userId: input.userId, jobId: input.jobId, status: "processing" });
    try {
      const journal = await this.repository.getJournalForUser(input.userId, input.journalId);
      const generated = await this.audioProvider.generateResetAudio({
        userId: input.userId,
        journalId: input.journalId,
        prompt: journal.rawText,
      });
      const objectKey = this.storage.createUserObjectKey(input.userId, generated.extension);
      await this.storage.uploadPrivateObject({ objectKey, mimeType: generated.mimeType, bytes: generated.bytes });
      const audio = await this.repository.createAudio(input.userId, {
        journalId: input.journalId,
        title: "Personal reset audio",
        durationSeconds: generated.durationSeconds,
        objectKey,
        mimeType: generated.mimeType,
        sizeBytes: generated.bytes.byteLength,
        playbackUrl: "",
        expiresAt: "",
      });
      await this.repository.updateJob({ userId: input.userId, jobId: input.jobId, status: "completed", resultId: audio.id });
    } catch (error) {
      await this.repository.updateJob({
        userId: input.userId,
        jobId: input.jobId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Audio generation failed.",
      });
      throw error;
    }
  }
}

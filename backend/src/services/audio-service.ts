import type { InMemoryRepository } from "../repositories/in-memory.js";

export class AudioService {
  constructor(private readonly repository: InMemoryRepository) {}

  get(userId: string, audioId: string) {
    return this.repository.getAudioForUser(userId, audioId);
  }

  delete(userId: string, audioId: string) {
    this.repository.deleteAudioForUser(userId, audioId);
    return { deleted: true as const };
  }

  createTestAudio(userId: string, journalId?: string) {
    return this.repository.createAudio(userId, {
      journalId,
      title: "Private signed test audio",
      durationSeconds: 600,
      playbackUrl: "https://signed-url.example.test/audio.mp3",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }
}


export interface AudioProviderResult {
  bytes: Uint8Array;
  mimeType: string;
  extension: string;
  durationSeconds: number;
}

export interface AudioProvider {
  generateResetAudio(input: { journalId: string; userId: string; prompt: string }): Promise<AudioProviderResult>;
}

export class DisabledAudioProvider implements AudioProvider {
  async generateResetAudio(): Promise<AudioProviderResult> {
    throw new Error("No reset-audio provider is configured. Audio generation is disabled.");
  }
}

export class MockAudioProvider implements AudioProvider {
  async generateResetAudio(): Promise<AudioProviderResult> {
    return {
      bytes: new TextEncoder().encode("mock audio bytes for automated tests only"),
      mimeType: "audio/mpeg",
      extension: "mp3",
      durationSeconds: 60,
    };
  }
}


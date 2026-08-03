import type { AiProvider } from "../services/ai-provider.js";
import type { AppRepository } from "../repositories/types.js";

export class AnalysisWorker {
  constructor(
    private readonly repository: AppRepository,
    private readonly aiProvider: AiProvider,
  ) {}

  async process(input: { userId: string; jobId: string; journalId: string; requestId: string }) {
    await this.repository.updateJob({ userId: input.userId, jobId: input.jobId, status: "processing" });
    try {
      const journal = await this.repository.getJournalForUser(input.userId, input.journalId);
      await this.aiProvider.analyseJournal({ journalId: input.journalId, text: journal.rawText, requestId: input.requestId });
      await this.repository.updateJob({ userId: input.userId, jobId: input.jobId, status: "completed", resultId: input.journalId });
    } catch (error) {
      await this.repository.updateJob({
        userId: input.userId,
        jobId: input.jobId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Analysis failed.",
      });
      throw error;
    }
  }
}


import type { EmotionalInsight } from "@innerpause/shared";
import { createRuntimeServices } from "../runtime/factory.js";
import type { PrivateDbActionResult, PrivateDbRequest } from "../internal/private-db-contract.js";
import { JobService } from "../jobs/job-service.js";
import { NoopQueueClient } from "../jobs/sqs-queue.js";
import type { AppRepository } from "../repositories/types.js";
import { JournalService } from "../services/journal-service.js";

export async function handler(event: PrivateDbRequest): Promise<PrivateDbActionResult> {
  const runtime = createRuntimeServices();
  const repository = runtime.repository;
  const journals = new JournalService(repository);
  const jobs = new JobService(repository, new NoopQueueClient());

  switch (event.action) {
    case "createAnalysisJob": {
      const user = await repository.ensureUser({
        providerSubject: event.authenticatedUser.id,
        email: event.authenticatedUser.email,
        fullName: event.authenticatedUser.fullName,
      });
      const journal = await journals.get(user.id, event.journalId);
      const created = await jobs.createJob(user.id, "journal_analysis", event.idempotencyKey, event.journalId);
      return {
        jobId: created.jobId,
        status: created.status,
        userId: user.id,
        journalId: event.journalId,
        journalText: journal.rawText,
      };
    }

    case "createAudioJob": {
      const user = await repository.ensureUser({
        providerSubject: event.authenticatedUser.id,
        email: event.authenticatedUser.email,
        fullName: event.authenticatedUser.fullName,
      });
      await journals.get(user.id, event.journalId);
      const created = await jobs.createJob(user.id, "reset_audio", event.idempotencyKey, event.journalId);
      return {
        jobId: created.jobId,
        status: created.status,
        userId: user.id,
        journalId: event.journalId,
      };
    }

    case "persistAnalysisResult": {
      await saveCompletedAnalysis(repository, event.userId, event.journalId, event.jobId, event.insight);
      return { jobId: event.jobId, status: "completed", userId: event.userId, journalId: event.journalId };
    }

    case "failJob": {
      await repository.updateJob({
        userId: event.userId,
        jobId: event.jobId,
        status: "failed",
        errorMessage: event.errorMessage,
      });
      return { jobId: event.jobId, status: "failed", userId: event.userId };
    }
  }
}

async function saveCompletedAnalysis(
  repository: AppRepository,
  userId: string,
  journalId: string,
  jobId: string,
  insight: EmotionalInsight,
) {
  const saved = await repository.saveAnalysis(userId, journalId, insight, "openai");
  await repository.updateJob({
    userId,
    jobId,
    status: "completed",
    resultId: saved.analysisId,
  });
}

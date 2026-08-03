import assert from "node:assert/strict";
import test from "node:test";
import type { AiProvider } from "../src/services/ai-provider.js";
import { InMemoryRepository } from "../src/repositories/in-memory.js";
import { JobService } from "../src/jobs/job-service.js";
import { AnalysisWorker } from "../src/workers/analysis-worker.js";

test("failed analysis job does not delete the journal", async () => {
  const repository = new InMemoryRepository();
  const userId = "user-worker-test";
  const journal = await repository.createJournal(userId, {
    title: "Private test",
    rawText: "This journal must remain after provider failure.",
  });
  const jobs = new JobService(repository);
  const created = await jobs.createJob(userId, "journal_analysis", "worker-idem", journal.id);
  const failingProvider: AiProvider = {
    async analyseJournal() {
      throw new Error("provider failed");
    },
  };

  const worker = new AnalysisWorker(repository, failingProvider);
  await assert.rejects(() => worker.process({ userId, jobId: created.jobId, journalId: journal.id, requestId: "req-worker" }));

  const preserved = await repository.getJournalForUser(userId, journal.id);
  assert.equal(preserved.id, journal.id);
});


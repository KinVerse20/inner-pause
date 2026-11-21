import type { JobStatus, JobStatusResponse, JobType } from "@innerpause/shared";
import { duplicateRequest, notFound } from "../shared/errors.js";
import type { AppRepository } from "../repositories/types.js";
import { NoopQueueClient, type QueueClient } from "./sqs-queue.js";

export class JobService {
  private jobs = new Map<string, JobStatusResponse & { userId: string }>();

  constructor(
    private readonly repository: AppRepository,
    private readonly queue: QueueClient = new NoopQueueClient(),
  ) {}

  async createJob(userId: string, type: JobType, idempotencyKey?: string, journalId?: string) {
    const duplicate = await this.repository.findJobByIdempotency(idempotencyKey, userId);
    if (duplicate) throw duplicateRequest(duplicate.jobId);

    const { jobId } = await this.repository.createJob({ userId, type, status: "queued", journalId, idempotencyKey });
    const job: JobStatusResponse & { userId: string } = {
      userId,
      jobId,
      type,
      status: "queued",
    };
    this.jobs.set(jobId, job);
    await this.repository.rememberJob(idempotencyKey, userId, jobId);
    await this.queue.enqueue({ jobId, userId, type, journalId }, idempotencyKey);
    return { jobId, status: "queued" as JobStatus };
  }

  failJob(userId: string, type: JobType, message: string) {
    const jobId = crypto.randomUUID();
    this.jobs.set(jobId, { userId, jobId, type, status: "failed", errorMessage: message });
    return { jobId, status: "failed" as JobStatus };
  }

  async getJob(userId: string, jobId: string) {
    const persisted = await this.repository.getJobForUser(userId, jobId).catch(() => null);
    if (persisted) return persisted;
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId) throw notFound("Job");
    return {
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      resultId: job.resultId,
      errorMessage: job.errorMessage,
    };
  }
}

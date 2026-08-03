import type { JobStatus, JobStatusResponse, JobType } from "@innerpause/shared";
import { duplicateRequest, notFound } from "../shared/errors.js";
import type { InMemoryRepository } from "../repositories/in-memory.js";

export class JobService {
  private jobs = new Map<string, JobStatusResponse & { userId: string }>();

  constructor(private readonly repository: InMemoryRepository) {}

  createJob(userId: string, type: JobType, idempotencyKey?: string) {
    const duplicate = this.repository.findJobByIdempotency(idempotencyKey, userId);
    if (duplicate) throw duplicateRequest(duplicate.jobId);

    const jobId = crypto.randomUUID();
    const job: JobStatusResponse & { userId: string } = {
      userId,
      jobId,
      type,
      status: "queued",
    };
    this.jobs.set(jobId, job);
    this.repository.rememberJob(idempotencyKey, userId, jobId);
    return { jobId, status: "queued" as JobStatus };
  }

  failJob(userId: string, type: JobType, message: string) {
    const jobId = crypto.randomUUID();
    this.jobs.set(jobId, { userId, jobId, type, status: "failed", errorMessage: message });
    return { jobId, status: "failed" as JobStatus };
  }

  getJob(userId: string, jobId: string) {
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

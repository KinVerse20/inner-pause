import { authenticate, CognitoTokenVerifier, type TokenVerifier } from "../auth/cognito.js";
import { InMemoryRepository } from "../repositories/in-memory.js";
import { JobService } from "../jobs/job-service.js";
import { JournalService } from "../services/journal-service.js";
import { AudioService } from "../services/audio-service.js";
import { NotificationService } from "../services/notification-service.js";
import { notFound } from "../shared/errors.js";
import { fail, ok, type HttpRequest, type HttpResponse } from "../shared/http.js";

export interface RouterOptions {
  repository?: InMemoryRepository;
  verifier?: TokenVerifier;
}

export class ApiRouter {
  private readonly repository: InMemoryRepository;
  private readonly verifier: TokenVerifier;
  private readonly journals: JournalService;
  private readonly jobs: JobService;
  private readonly audio: AudioService;
  private readonly notifications = new NotificationService();

  constructor(options: RouterOptions = {}) {
    this.repository = options.repository ?? new InMemoryRepository();
    this.verifier = options.verifier ?? new CognitoTokenVerifier();
    this.journals = new JournalService(this.repository);
    this.jobs = new JobService(this.repository);
    this.audio = new AudioService(this.repository);
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const path = normalisePath(request.path);

      if (request.method === "GET" && path === "/health") {
        return ok({ ok: true, service: "innerpause-backend" }, request.requestId);
      }

      const user = await authenticate(request.headers, this.verifier);

      if (request.method === "POST" && path === "/auth/session") {
        return ok(user, request.requestId);
      }

      if (request.method === "GET" && path === "/me") {
        return ok(user, request.requestId);
      }

      if (request.method === "POST" && path === "/journals") {
        return ok({ journal: this.journals.create(user.id, request.body as never) }, request.requestId, 201);
      }

      if (request.method === "GET" && path === "/journals") {
        return ok(this.journals.list(user.id), request.requestId);
      }

      const journalMatch = /^\/journals\/([^/]+)$/.exec(path);
      if (journalMatch && request.method === "GET") {
        return ok(this.journals.get(user.id, decodeURIComponent(journalMatch[1])), request.requestId);
      }

      if (journalMatch && request.method === "DELETE") {
        return ok(this.journals.delete(user.id, decodeURIComponent(journalMatch[1])), request.requestId);
      }

      const analyseMatch = /^\/journals\/([^/]+)\/analyse$/.exec(path);
      if (analyseMatch && request.method === "POST") {
        this.journals.get(user.id, decodeURIComponent(analyseMatch[1]));
        return ok(this.jobs.createJob(user.id, "journal_analysis", request.headers["idempotency-key"]), request.requestId, 202);
      }

      const resetAudioMatch = /^\/journals\/([^/]+)\/reset-audio$/.exec(path);
      if (resetAudioMatch && request.method === "POST") {
        this.journals.get(user.id, decodeURIComponent(resetAudioMatch[1]));
        return ok(this.jobs.createJob(user.id, "reset_audio", request.headers["idempotency-key"]), request.requestId, 202);
      }

      const jobMatch = /^\/jobs\/([^/]+)$/.exec(path);
      if (jobMatch && request.method === "GET") {
        return ok(this.jobs.getJob(user.id, decodeURIComponent(jobMatch[1])), request.requestId);
      }

      const audioMatch = /^\/audio\/([^/]+)$/.exec(path);
      if (audioMatch && request.method === "GET") {
        return ok(this.audio.get(user.id, decodeURIComponent(audioMatch[1])), request.requestId);
      }

      if (audioMatch && request.method === "DELETE") {
        return ok(this.audio.delete(user.id, decodeURIComponent(audioMatch[1])), request.requestId);
      }

      if (request.method === "GET" && path === "/insights") {
        return ok({ journalCount: this.journals.list(user.id).length, recurringEmotions: [] }, request.requestId);
      }

      if (request.method === "GET" && path === "/notifications") {
        return ok(this.notifications.list(), request.requestId);
      }

      if (request.method === "POST" && path === "/notifications/test") {
        return ok(this.notifications.createTest(), request.requestId, 202);
      }

      throw notFound("Endpoint");
    } catch (error) {
      return fail(error, request.requestId);
    }
  }

  createTestAudioForUser(userId: string, journalId?: string) {
    return this.audio.createTestAudio(userId, journalId);
  }
}

function normalisePath(path: string) {
  return path.replace(/^\/api\/v1/, "") || "/";
}


import { authenticate, type TokenVerifier } from "../auth/cognito.js";
import { InMemoryRepository } from "../repositories/in-memory.js";
import type { AppRepository } from "../repositories/types.js";
import { createRuntimeServices } from "../runtime/factory.js";
import { JobService } from "../jobs/job-service.js";
import type { QueueClient } from "../jobs/sqs-queue.js";
import { JournalService } from "../services/journal-service.js";
import { AudioService } from "../services/audio-service.js";
import { notFound } from "../shared/errors.js";
import { fail, ok, type HttpRequest, type HttpResponse } from "../shared/http.js";

export interface RouterOptions {
  repository?: AppRepository;
  verifier?: TokenVerifier;
  queue?: QueueClient;
}

export class ApiRouter {
  private readonly repository: AppRepository;
  private readonly verifier: TokenVerifier;
  private readonly journals: JournalService;
  private readonly jobs: JobService;
  private readonly audio: AudioService;

  constructor(options: RouterOptions = {}) {
    const runtime = options.repository && options.verifier ? null : createRuntimeServices();
    this.repository = options.repository ?? runtime?.repository ?? new InMemoryRepository();
    this.verifier = options.verifier ?? runtime!.verifier;
    this.journals = new JournalService(this.repository);
    this.jobs = new JobService(this.repository, options.queue ?? runtime?.queue);
    this.audio = new AudioService(this.repository);
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const path = normalisePath(request.path);

      if (request.method === "GET" && path === "/health") {
        return ok({ ok: true, service: "innerpause-backend" }, request.requestId);
      }

      if (request.method === "POST" && path === "/analysis/quick") {
        const body = request.body as { text?: string } | undefined;
        const text = body?.text?.trim();
        if (!text) throw notFound("Reflection text");
        return ok({ analysis: createQuickAnalysis(text) }, request.requestId);
      }

      const tokenUser = await authenticate(request.headers, this.verifier);
      const user = await this.repository.ensureUser({
        providerSubject: tokenUser.id,
        email: tokenUser.email,
        fullName: tokenUser.fullName,
      });

      if (request.method === "POST" && path === "/auth/session") {
        return ok(user, request.requestId);
      }

      if (request.method === "GET" && path === "/me") {
        return ok(user, request.requestId);
      }

      if (request.method === "POST" && path === "/journals") {
        return ok({ journal: await this.journals.create(user.id, request.body as never) }, request.requestId, 201);
      }

      if (request.method === "GET" && path === "/journals") {
        return ok(await this.journals.list(user.id), request.requestId);
      }

      const journalMatch = /^\/journals\/([^/]+)$/.exec(path);
      if (journalMatch && request.method === "GET") {
        return ok(await this.journals.get(user.id, decodeURIComponent(journalMatch[1])), request.requestId);
      }

      if (journalMatch && request.method === "DELETE") {
        return ok(await this.journals.delete(user.id, decodeURIComponent(journalMatch[1])), request.requestId);
      }

      const analyseMatch = /^\/journals\/([^/]+)\/analyse$/.exec(path);
      if (analyseMatch && request.method === "POST") {
        const journalId = decodeURIComponent(analyseMatch[1]);
        await this.journals.get(user.id, journalId);
        return ok(await this.jobs.createJob(user.id, "journal_analysis", request.headers["idempotency-key"], journalId), request.requestId, 202);
      }

      const resetAudioMatch = /^\/journals\/([^/]+)\/reset-audio$/.exec(path);
      if (resetAudioMatch && request.method === "POST") {
        const journalId = decodeURIComponent(resetAudioMatch[1]);
        await this.journals.get(user.id, journalId);
        return ok(await this.jobs.createJob(user.id, "reset_audio", request.headers["idempotency-key"], journalId), request.requestId, 202);
      }

      const jobMatch = /^\/jobs\/([^/]+)$/.exec(path);
      if (jobMatch && request.method === "GET") {
        return ok(await this.jobs.getJob(user.id, decodeURIComponent(jobMatch[1])), request.requestId);
      }

      const audioMatch = /^\/audio\/([^/]+)$/.exec(path);
      if (audioMatch && request.method === "GET") {
        return ok(await this.audio.get(user.id, decodeURIComponent(audioMatch[1])), request.requestId);
      }

      if (audioMatch && request.method === "DELETE") {
        return ok(await this.audio.delete(user.id, decodeURIComponent(audioMatch[1])), request.requestId);
      }

      if (request.method === "GET" && path === "/insights") {
        return ok({ journalCount: (await this.journals.list(user.id)).length, recurringEmotions: [] }, request.requestId);
      }

      if (request.method === "GET" && path === "/preferences") {
        return ok(await this.repository.getPreferences(user.id), request.requestId);
      }

      if (request.method === "PATCH" && path === "/preferences") {
        return ok(await this.repository.updatePreferences(user.id, request.body as never), request.requestId);
      }

      if (request.method === "GET" && path === "/notifications") {
        return ok(await this.repository.listNotifications(user.id), request.requestId);
      }

      if (request.method === "POST" && path === "/notifications/test") {
        const message = await this.repository.createNotification({
          userId: user.id,
          messageText: "Test notification queued for AWS safety validation.",
          deliveryChannel: "mock",
          deliveryStatus: "queued",
          idempotencyKey: request.headers["idempotency-key"],
        });
        return ok({ queued: true, notification: message }, request.requestId, 202);
      }

      throw notFound("Endpoint");
    } catch (error) {
      return fail(error, request.requestId);
    }
  }

  async createTestAudioForUser(userId: string, journalId?: string) {
    return this.audio.createTestAudio(userId, journalId);
  }
}

function normalisePath(path: string) {
  return path.replace(/^\/api\/v1/, "") || "/";
}

function createQuickAnalysis(text: string) {
  const lower = text.toLowerCase();
  const safetyFlag = ["suicide", "kill myself", "self harm", "end my life"].some((word) => lower.includes(word));
  const emotion = lower.includes("angry")
    ? "Frustration"
    : lower.includes("sad") || lower.includes("lonely")
      ? "Sadness"
      : lower.includes("focus") || lower.includes("confused")
        ? "Mental noise"
        : "Overwhelm";
  const chakra = emotion === "Frustration" ? "throat" : emotion === "Sadness" ? "heart" : emotion === "Mental noise" ? "third-eye" : "root";

  return {
    summary: safetyFlag
      ? "Your reflection may need immediate human support before a normal reset session."
      : "Here is what we noticed in your reflection: your system may be asking for a slower, steadier reset.",
    originalEntrySummary: text.length > 220 ? `${text.slice(0, 217)}...` : text,
    understandingSummary: "Based on what you shared, this may be a moment to pause, breathe and let your body settle before deciding what comes next.",
    keyIncidents: [{ id: crypto.randomUUID(), text: text.length > 180 ? `${text.slice(0, 177)}...` : text }],
    emotions: [
      {
        name: emotion,
        intensity: 7,
        level: "medium",
        explanation: "This emotion appeared from the words and tone in your reflection.",
      },
    ],
    triggers: ["Emotional load"],
    chakraAssociations: [
      {
        chakra,
        emotionalTheme: "Supportive reset",
        reason: "This theme may benefit from a calming sound and breath-based reset.",
        sessionSupport: "The reset will use simple guidance and local Chakra audio to support reflection.",
        confidence: 0.62,
      },
    ],
    healingApproachSummary: "Start with grounding breath, continue with calming sound, and close with a simple reflection.",
    suggestedOutcome: safetyFlag ? "Pause and seek immediate human support." : "Feel more settled and emotionally clear.",
    recommendedDuration: safetyFlag ? 5 : 10,
    safetyFlag,
    analysisSource: "fallback",
  };
}

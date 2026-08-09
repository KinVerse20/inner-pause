import { authenticate, type AuthenticatedUser, type TokenVerifier } from "../auth/cognito.js";
import { InMemoryRepository } from "../repositories/in-memory.js";
import type { AppRepository } from "../repositories/types.js";
import { createRuntimeServices } from "../runtime/factory.js";
import { JobService } from "../jobs/job-service.js";
import type { QueueClient } from "../jobs/sqs-queue.js";
import { JournalService } from "../services/journal-service.js";
import { AudioService } from "../services/audio-service.js";
import { AwsAdminDashboardProvider, type AdminDashboardProvider } from "../services/admin-dashboard.js";
import { forbidden, notFound } from "../shared/errors.js";
import { fail, ok, type HttpRequest, type HttpResponse } from "../shared/http.js";
import { readConfig, type BackendConfig } from "../config/env.js";
import { createAiQuickAnalysis } from "../services/quick-analysis.js";

export interface RouterOptions {
  repository?: AppRepository;
  verifier?: TokenVerifier;
  queue?: QueueClient;
  adminProvider?: AdminDashboardProvider;
  config?: BackendConfig;
}

export class ApiRouter {
  private readonly repository: AppRepository;
  private readonly verifier: TokenVerifier;
  private readonly journals: JournalService;
  private readonly jobs: JobService;
  private readonly audio: AudioService;
  private readonly adminProvider: AdminDashboardProvider;
  private readonly config: BackendConfig;

  constructor(options: RouterOptions = {}) {
    const runtime = options.repository && options.verifier ? null : createRuntimeServices();
    this.config = options.config ?? readConfig();
    this.repository = options.repository ?? runtime?.repository ?? new InMemoryRepository();
    this.verifier = options.verifier ?? runtime!.verifier;
    this.journals = new JournalService(this.repository);
    this.jobs = new JobService(this.repository, options.queue ?? runtime?.queue);
    this.audio = new AudioService(this.repository);
    this.adminProvider = options.adminProvider ?? new AwsAdminDashboardProvider(this.config);
  }

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const path = normalisePath(request.path);

      if (request.method === "GET" && path === "/health") {
        return ok({ ok: true, service: "innerpause-backend" }, request.requestId);
      }

      const tokenUser = request.authenticatedUser ?? (await authenticate(request.headers, this.verifier));

      if (request.method === "POST" && path === "/analysis/quick") {
        const body = request.body as { text?: string } | undefined;
        const text = body?.text?.trim();
        if (!text) throw notFound("Reflection text");
        return ok(
          {
            analysis: await createAiQuickAnalysis({
              text,
              requestId: request.requestId,
              config: this.config,
            }),
          },
          request.requestId,
        );
      }

      if (path === "/admin/overview" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getOverview(), request.requestId);
      }

      if (path === "/admin/alerts" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getAlerts(queryFilters(request.path)), request.requestId);
      }

      if (path === "/admin/costs" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getCosts(), request.requestId);
      }

      if (path === "/admin/database" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getDatabaseHealth(), request.requestId);
      }

      if (path === "/admin/api-usage" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getApiUsage(), request.requestId);
      }

      if (path === "/admin/file-upload-security" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getFileUploadSecurity(), request.requestId);
      }

      if (path === "/admin/security" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getSecurityStatus(), request.requestId);
      }

      if (path === "/admin/suspicious-logins" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getSuspiciousLogins(), request.requestId);
      }

      if (path === "/admin/privacy-tests" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getPrivacyTests(), request.requestId);
      }

      if (path === "/admin/backups" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getBackupStatus(), request.requestId);
      }

      if (path === "/admin/test-runs" && request.method === "GET") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.getTestRuns(), request.requestId);
      }

      if (path === "/admin/test-runs" && request.method === "POST") {
        this.requireAdmin(tokenUser);
        return ok(await this.adminProvider.runCompleteTest({ actorId: tokenUser.id, idempotencyKey: request.headers["idempotency-key"] }), request.requestId, 202);
      }

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
      console.error("API request failed", {
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return fail(error, request.requestId);
    }
  }

  async createTestAudioForUser(userId: string, journalId?: string) {
    return this.audio.createTestAudio(userId, journalId);
  }

  private requireAdmin(user: AuthenticatedUser) {
    if (!user.groups.includes(this.config.adminGroupName)) throw forbidden();
    console.info("admin_action", JSON.stringify({ action: "admin_route_access", actorId: user.id, at: new Date().toISOString() }));
  }
}

function normalisePath(path: string) {
  return path.replace(/^\/api\/v1/, "").split("?")[0] || "/";
}

function queryFilters(path: string) {
  const [, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  return {
    service: params.get("service") ?? undefined,
    severity: params.get("severity") ?? undefined,
    state: params.get("state") ?? undefined,
  };
}


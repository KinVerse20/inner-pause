import type { AdminDashboardProvider } from "../services/admin-dashboard.js";
import { AwsAdminDashboardProvider } from "../services/admin-dashboard.js";
import { CognitoJwtVerifier, authenticatedUserFromClaims, authenticate, type AuthenticatedUser } from "../auth/cognito.js";
import { readConfig } from "../config/env.js";
import type { PrivateDbActionResult } from "../internal/private-db-contract.js";
import { SqsQueueClient } from "../jobs/sqs-queue.js";
import { invokeLambdaJson } from "../runtime/lambda-invoke.js";
import { readSecretString } from "../runtime/secrets.js";
import { createAiQuickAnalysis } from "../services/quick-analysis.js";
import { forbidden, notFound } from "../shared/errors.js";
import { fail, ok, requestIdFrom, securityHeaders } from "../shared/http.js";

const config = readConfig();
const verifier = new CognitoJwtVerifier(config);
const adminProvider = new AwsAdminDashboardProvider(config);
const queue =
  config.region && (config.analysisQueueUrl || config.audioQueueUrl || config.notificationQueueUrl || config.workQueueUrl)
    ? new SqsQueueClient({
        region: config.region,
        queueUrl: config.workQueueUrl,
        analysisQueueUrl: config.analysisQueueUrl,
        audioQueueUrl: config.audioQueueUrl,
        notificationQueueUrl: config.notificationQueueUrl,
      })
    : undefined;

interface ApiGatewayEvent {
  httpMethod?: string;
  path?: string;
  rawPath?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  requestContext?: {
    authorizer?: {
      claims?: Record<string, unknown>;
    };
  };
}

export async function handler(event: ApiGatewayEvent) {
  const headers = lowerHeaders(event.headers ?? {});
  const requestId = requestIdFrom(headers);
  const body = parseBody(event.body);
  const path = event.path ?? event.rawPath ?? "/";

  try {
    if (event.httpMethod === "GET" && normalisePath(path) === "/health") {
      return respond(ok({ ok: true, service: "innerpause-backend" }, requestId), headers, requestId);
    }

    const user = await resolveAuthenticatedUser(event, headers);
    const route = normalisePath(path);

    if (event.httpMethod === "POST" && route === "/analysis/quick") {
      const text = typeof (body as { text?: string } | undefined)?.text === "string" ? (body as { text: string }).text.trim() : "";
      if (!text) throw notFound("Reflection text");
      return respond(ok({ analysis: await createAiQuickAnalysis({ text, requestId, config }) }, requestId), headers, requestId);
    }

    if (route.startsWith("/admin/")) {
      requireAdmin(user, config.adminGroupName);
      return respond(await handleAdminRoute(event.httpMethod ?? "GET", route, requestId, user, adminProvider, headers), headers, requestId);
    }

    const analyseMatch = /^\/journals\/([^/]+)\/analyse$/.exec(route);
    if (analyseMatch && event.httpMethod === "POST") {
      const journalId = decodeURIComponent(analyseMatch[1]);
      const internal = await invokePrivateDb<PrivateDbActionResult>({
        action: "createAnalysisJob",
        authenticatedUser: user,
        journalId,
        requestId,
        idempotencyKey: headers["idempotency-key"],
      });
      try {
        const apiKey = await resolveOpenAiApiKey();
        if (!apiKey) throw new Error("OpenAI API key is not configured.");
        await requireQueue().enqueue(
          {
            jobId: required(internal.jobId, "jobId"),
            userId: required(internal.userId, "userId"),
            type: "journal_analysis",
            journalId,
            journalText: required(internal.journalText, "journalText"),
          },
          headers["idempotency-key"],
        );
      } catch (error) {
        await invokePrivateDb({
          action: "failJob",
          userId: required(internal.userId, "userId"),
          jobId: required(internal.jobId, "jobId"),
          errorMessage: error instanceof Error ? error.message : "Analysis dispatch failed.",
        }).catch(() => undefined);
        throw error;
      }
      return respond(ok({ jobId: internal.jobId, status: internal.status }, requestId, 202), headers, requestId);
    }

    const resetAudioMatch = /^\/journals\/([^/]+)\/reset-audio$/.exec(route);
    if (resetAudioMatch && event.httpMethod === "POST") {
      const journalId = decodeURIComponent(resetAudioMatch[1]);
      const internal = await invokePrivateDb<PrivateDbActionResult>({
        action: "createAudioJob",
        authenticatedUser: user,
        journalId,
        requestId,
        idempotencyKey: headers["idempotency-key"],
      });
      try {
        await requireQueue().enqueue(
          {
            jobId: required(internal.jobId, "jobId"),
            userId: required(internal.userId, "userId"),
            type: "reset_audio",
            journalId,
          },
          headers["idempotency-key"],
        );
      } catch (error) {
        await invokePrivateDb({
          action: "failJob",
          userId: required(internal.userId, "userId"),
          jobId: required(internal.jobId, "jobId"),
          errorMessage: error instanceof Error ? error.message : "Audio dispatch failed.",
        }).catch(() => undefined);
        throw error;
      }
      return respond(ok({ jobId: internal.jobId, status: internal.status }, requestId, 202), headers, requestId);
    }

    throw notFound("Endpoint");
  } catch (error) {
    return respond(fail(error, requestId), headers, requestId);
  }
}

async function handleAdminRoute(
  method: string,
  path: string,
  requestId: string,
  user: AuthenticatedUser,
  provider: AdminDashboardProvider,
  headers: Record<string, string | undefined>,
) {
  if (path === "/admin/overview" && method === "GET") {
    return ok(await provider.getOverview(), requestId);
  }
  if (path === "/admin/alerts" && method === "GET") {
    return ok(await provider.getAlerts(queryFilters(path)), requestId);
  }
  if (path === "/admin/costs" && method === "GET") {
    return ok(await provider.getCosts(), requestId);
  }
  if (path === "/admin/database" && method === "GET") {
    return ok(await provider.getDatabaseHealth(), requestId);
  }
  if (path === "/admin/api-usage" && method === "GET") {
    return ok(await provider.getApiUsage(), requestId);
  }
  if (path === "/admin/file-upload-security" && method === "GET") {
    return ok(await provider.getFileUploadSecurity(), requestId);
  }
  if (path === "/admin/security" && method === "GET") {
    return ok(await provider.getSecurityStatus(), requestId);
  }
  if (path === "/admin/suspicious-logins" && method === "GET") {
    return ok(await provider.getSuspiciousLogins(), requestId);
  }
  if (path === "/admin/privacy-tests" && method === "GET") {
    return ok(await provider.getPrivacyTests(), requestId);
  }
  if (path === "/admin/backups" && method === "GET") {
    return ok(await provider.getBackupStatus(), requestId);
  }
  if (path === "/admin/test-runs" && method === "GET") {
    return ok(await provider.getTestRuns(), requestId);
  }
  if (path === "/admin/test-runs" && method === "POST") {
    return ok(await provider.runCompleteTest({ actorId: user.id, idempotencyKey: headers["idempotency-key"] }), requestId, 202);
  }
  throw notFound("Endpoint");
}

async function resolveAuthenticatedUser(event: ApiGatewayEvent, headers: Record<string, string | undefined>) {
  const trusted = authenticatedUserFromClaims(event.requestContext?.authorizer?.claims ?? null);
  if (trusted) return trusted;
  return authenticate(headers, verifier);
}

async function resolveOpenAiApiKey() {
  if (config.openAiApiKey) return config.openAiApiKey;
  if (config.region && config.openAiApiKeySecretArn) {
    return readSecretString({ region: config.region, secretArn: config.openAiApiKeySecretArn, jsonKey: "OPENAI_API_KEY" });
  }
  return undefined;
}

function requireQueue() {
  if (!queue) throw new Error("SQS queue client is not configured.");
  return queue;
}

async function invokePrivateDb<TResponse>(payload: unknown): Promise<TResponse> {
  if (!config.region || !config.privateDbLambdaName) throw new Error("Private database Lambda is not configured.");
  return invokeLambdaJson<TResponse>({
    functionName: config.privateDbLambdaName,
    region: config.region,
    payload,
  });
}

function respond(response: ReturnType<typeof ok>, headers: Record<string, string | undefined>, requestId: string) {
  return {
    ...response,
    headers: {
      ...response.headers,
      ...securityHeaders(),
      ...corsHeaders(headers),
      "x-request-id": requestId,
    },
  };
}

function corsHeaders(headers: Record<string, string | undefined>) {
  const origin = headers.origin;
  if (!origin || !config.allowedOrigins.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    vary: "origin",
  };
}

function lowerHeaders(headers: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

function parseBody(body: string | null | undefined) {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
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

function requireAdmin(user: AuthenticatedUser, adminGroupName: string) {
  if (!user.groups.includes(adminGroupName)) throw forbidden();
}

function required<T>(value: T | undefined, field: string): T {
  if (value === undefined || value === null || value === "") throw new Error(`Internal result missing ${field}.`);
  return value;
}

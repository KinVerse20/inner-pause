import type {
  ApiErrorBody,
  ApiSuccess,
  AudioRecord,
  CreateJobResponse,
  CreateJournalRequest,
  CreateJournalResponse,
  CurrentUser,
  InsightSummary,
  JobStatusResponse,
  JournalDetail,
  JournalSummary,
  NotificationMessage,
} from "@innerpause/shared";
import { readFrontendConfig } from "@/lib/config/env";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;
  readonly details?: Record<string, unknown>;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.code = input.code;
    this.requestId = input.requestId;
    this.details = input.details;
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  onUnauthorised?: () => void;
}

export class InnerPauseApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: ApiClientOptions["getAccessToken"];
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly onUnauthorised?: () => void;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? readFrontendConfig().apiBaseUrl).replace(/\/$/, "");
    this.getAccessToken = options.getAccessToken;
    this.timeoutMs = options.timeoutMs ?? 12000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.onUnauthorised = options.onUnauthorised;
  }

  async session() {
    return this.request<CurrentUser>("/auth/session", { method: "POST" });
  }

  async me() {
    return this.request<CurrentUser>("/me");
  }

  async createJournal(body: CreateJournalRequest) {
    return this.request<CreateJournalResponse>("/journals", { method: "POST", body });
  }

  async listJournals() {
    return this.request<JournalSummary[]>("/journals");
  }

  async getJournal(id: string) {
    return this.request<JournalDetail>(`/journals/${encodeURIComponent(id)}`);
  }

  async deleteJournal(id: string) {
    return this.request<{ deleted: true }>(`/journals/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async analyseJournal(id: string, idempotencyKey?: string) {
    return this.request<CreateJobResponse>(`/journals/${encodeURIComponent(id)}/analyse`, {
      method: "POST",
      idempotencyKey,
    });
  }

  async analyseText(text: string) {
    return this.request<unknown>("/analysis/quick", { method: "POST", body: { text } });
  }

  async createResetAudio(id: string, idempotencyKey?: string) {
    return this.request<CreateJobResponse>(`/journals/${encodeURIComponent(id)}/reset-audio`, {
      method: "POST",
      idempotencyKey,
    });
  }

  async getJob(jobId: string) {
    return this.request<JobStatusResponse>(`/jobs/${encodeURIComponent(jobId)}`);
  }

  async getAudio(id: string) {
    return this.request<AudioRecord>(`/audio/${encodeURIComponent(id)}`);
  }

  async deleteAudio(id: string) {
    return this.request<{ deleted: true }>(`/audio/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async getInsights() {
    return this.request<InsightSummary>("/insights");
  }

  async getPreferences() {
    return this.request<Record<string, unknown>>("/preferences");
  }

  async updatePreferences(body: Record<string, unknown>) {
    return this.request<Record<string, unknown>>("/preferences", { method: "PATCH", body });
  }

  async listNotifications() {
    return this.request<NotificationMessage[]>("/notifications");
  }

  async sendTestNotification() {
    return this.request<{ queued: boolean }>("/notifications/test", { method: "POST" });
  }

  async health() {
    return this.request<{ ok: boolean; service: string }>("/health", { auth: false });
  }

  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      auth?: boolean;
      idempotencyKey?: string;
    } = {},
  ): Promise<T> {
    const requestId = createRequestId();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        accept: "application/json",
        "content-type": "application/json",
        "x-request-id": requestId,
      };

      if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;

      if (options.auth !== false && this.getAccessToken) {
        const token = await this.getAccessToken();
        if (token) headers.authorization = `Bearer ${token}`;
      }

      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as ApiSuccess<T> | ApiErrorBody) : undefined;

      if (!response.ok) {
        const errorBody = payload && "error" in payload ? payload.error : undefined;
        const error = new ApiClientError({
          status: response.status,
          code: errorBody?.code ?? "INTERNAL_ERROR",
          message: errorBody?.message ?? "The request could not be completed.",
          requestId: errorBody?.requestId ?? response.headers.get("x-request-id") ?? requestId,
          details: errorBody?.details,
        });
        if (response.status === 401) this.onUnauthorised?.();
        throw error;
      }

      return payload && "data" in payload ? payload.data : (undefined as T);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiClientError({
          status: 408,
          code: "INTERNAL_ERROR",
          message: "The request timed out.",
          requestId,
        });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

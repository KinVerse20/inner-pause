import type { ApiErrorBody, ApiSuccess } from "@innerpause/shared";
import { AppError } from "./errors.js";

export interface HttpRequest {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  body?: unknown;
  requestId: string;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function ok<T>(data: T, requestId: string, statusCode = 200): HttpResponse {
  return json(statusCode, { data, requestId } satisfies ApiSuccess<T>);
}

export function noContent(): HttpResponse {
  return { statusCode: 204, headers: securityHeaders(), body: "" };
}

export function fail(error: unknown, requestId: string): HttpResponse {
  if (error instanceof AppError) {
    return json(error.status, {
      error: {
        code: error.code,
        message: error.message,
        requestId,
        details: error.details,
      },
    } satisfies ApiErrorBody);
  }

  return json(500, {
    error: {
      code: "INTERNAL_ERROR",
      message: "The request could not be completed.",
      requestId,
    },
  } satisfies ApiErrorBody);
}

export function json(statusCode: number, payload: unknown): HttpResponse {
  return {
    statusCode,
    headers: {
      ...securityHeaders(),
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

export function securityHeaders() {
  return {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  };
}

export function requestIdFrom(headers: Record<string, string | undefined>) {
  return headers["x-request-id"] ?? crypto.randomUUID();
}


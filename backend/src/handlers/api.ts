import { ApiRouter } from "../routes/router.js";
import { readConfig } from "../config/env.js";
import { requestIdFrom, securityHeaders } from "../shared/http.js";

const router = new ApiRouter();
const config = readConfig();

interface ApiGatewayEvent {
  httpMethod?: string;
  path?: string;
  rawPath?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
}

export async function handler(event: ApiGatewayEvent) {
  const headers = lowerHeaders(event.headers ?? {});
  const requestId = requestIdFrom(headers);
  const body = parseBody(event.body);
  const response = await router.handle({
    method: event.httpMethod ?? "GET",
    path: event.path ?? event.rawPath ?? "/",
    headers,
    body,
    requestId,
  });

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

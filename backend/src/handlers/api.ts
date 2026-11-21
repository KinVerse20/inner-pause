import { authenticatedUserFromClaims } from "../auth/cognito.js";
import { ApiRouter } from "../routes/router.js";
import { readConfig } from "../config/env.js";
import { requestIdFrom, securityHeaders } from "../shared/http.js";
import { corsHeaders } from "../shared/cors.js";

const router = new ApiRouter();
const config = readConfig();

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
  const response = await router.handle({
    method: event.httpMethod ?? "GET",
    path: event.path ?? event.rawPath ?? "/",
    headers,
    body,
    requestId,
    authenticatedUser: authenticatedUserFromClaims(event.requestContext?.authorizer?.claims ?? null),
  });

  return {
    ...response,
    headers: {
      ...response.headers,
      ...securityHeaders(),
      ...corsHeaders(headers, config.allowedOrigins),
      "x-request-id": requestId,
    },
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

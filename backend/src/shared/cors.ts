export function corsHeaders(headers: Record<string, string | undefined>, allowedOrigins: string[]) {
  const origin = headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "Authorization,Content-Type,Idempotency-Key,X-Request-Id",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    vary: "Origin",
  };
}

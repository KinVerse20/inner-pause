import { createServer } from "node:http";
import { ApiRouter } from "./routes/router.js";
import { readConfig } from "./config/env.js";
import { requestIdFrom, securityHeaders } from "./shared/http.js";

const config = readConfig();
const router = new ApiRouter();

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const requestHeaders = Object.fromEntries(
    Object.entries(req.headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value.join(",") : value]),
  );
  const requestId = requestIdFrom(requestHeaders);

  if (req.method === "OPTIONS") {
    writeCors(res, origin);
    res.writeHead(204, { ...securityHeaders(), "x-request-id": requestId });
    res.end();
    return;
  }

  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 1024 * 128) req.destroy();
  });

  req.on("end", async () => {
    const response = await router.handle({
      method: req.method ?? "GET",
      path: req.url?.split("?")[0] ?? "/",
      headers: requestHeaders,
      body: raw ? JSON.parse(raw) : undefined,
      requestId,
    });
    writeCors(res, origin);
    res.writeHead(response.statusCode, { ...response.headers, "x-request-id": requestId });
    res.end(response.body);
  });
});

server.listen(config.port, () => {
  console.log(`InnerPause backend listening on http://localhost:${config.port}${config.apiBasePath}`);
});

function writeCors(res: import("node:http").ServerResponse, origin: string | undefined) {
  if (origin && config.allowedOrigins.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
    res.setHeader("access-control-allow-credentials", "true");
  }
  res.setHeader("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "authorization,content-type,idempotency-key,x-request-id");
}


import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { allowedOrigins, getPort, loadBackendEnv } from "./env";
import { pingMongo } from "./mongo";
import { analyzeRoutes } from "./routes/analyze";
import { authRoutes } from "./routes/auth";
import { profileRoutes } from "./routes/profile";
import { tellRoutes } from "./routes/tell";

loadBackendEnv();

const app = new Hono();
const origins = allowedOrigins();

app.use(
  "/api/*",
  cors({
    origin: (origin) => (origin && origins.includes(origin) ? origin : origins[0] ?? "http://localhost:3000"),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/api/health", async (c) => {
  try {
    await pingMongo();
    return c.json({ ok: true, service: "inner-pause-api", database: "mongodb" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MongoDB is unavailable.";
    return c.json({ ok: false, service: "inner-pause-api", database: "mongodb", error: message }, 503);
  }
});

app.route("/api/auth", authRoutes);
app.route("/api/analyze", analyzeRoutes);
app.route("/api/tell-interpret", tellRoutes);
app.route("/api/profile", profileRoutes);

const port = getPort();

serve({ fetch: app.fetch, port }, () => {
  console.log(`Inner Pause API listening on http://localhost:${port}`);
});

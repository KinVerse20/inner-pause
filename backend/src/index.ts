import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { getPort, loadBackendEnv } from "./env";
import { startReminderScheduler } from "./push-scheduler";
import { startRenderWorker } from "./render-store";

loadBackendEnv();

const app = createApp();
const port = getPort();

serve({ fetch: app.fetch, port }, () => {
  console.log(`Inner Pause API listening on http://localhost:${port}`);
  // Renders card sounds in the background (backend/src/render-store.ts).
  // Sends Practice reminders by web push (backend/src/push-scheduler.ts).
  startReminderScheduler();
  startRenderWorker().catch((error) => console.error("[renders] worker failed to start:", error instanceof Error ? error.message : error));
});

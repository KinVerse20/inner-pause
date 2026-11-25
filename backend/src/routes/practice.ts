import { Hono } from "hono";

import { getVerifiedSession } from "../auth/session";
import { invalidBody, readJsonObject } from "../http";
import { removeSubscription, saveSubscription } from "../push-store";
import { vapidConfig } from "../push-scheduler";
import { isPracticePathId, isValidTimeZone, parseReminderTime } from "../reminders";

// Practice reminders (ported from Kinverse's /practices/push-subscriptions,
// on our cookie sessions). The app subscribes the device when you start a
// path (frontend/lib/programme-notifications.ts); push-scheduler.ts sends.
export const practiceRoutes = new Hono();

const BASE64URL = /^[A-Za-z0-9_-]+=*$/;
const key = (value: unknown, max: number) => (typeof value === "string" && value.length > 0 && value.length <= max && BASE64URL.test(value) ? value : null);

function pushEndpoint(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** A subscription request, checked; or what's wrong with it. */
export function parseSubscriptionBody(body: Record<string, unknown>) {
  const subscription = (body.subscription ?? {}) as Record<string, unknown>;
  const keys = (subscription.keys ?? {}) as Record<string, unknown>;
  const endpoint = pushEndpoint(subscription.endpoint);
  const p256dh = key(keys.p256dh, 200);
  const auth = key(keys.auth, 100);
  if (!endpoint || !p256dh || !auth) return { error: "A valid push subscription is required." } as const;
  if (!isPracticePathId(body.pathId)) return { error: "Unknown Practice path." } as const;
  if (parseReminderTime(body.reminderTime) === null) return { error: "Reminder time must look like 20:00." } as const;
  if (!isValidTimeZone(body.timezone)) return { error: "Unknown time zone." } as const;
  return {
    value: {
      endpoint,
      keys: { p256dh, auth },
      pathId: body.pathId,
      reminderTime: body.reminderTime as string,
      timezone: body.timezone,
    },
  } as const;
}

// Public: the key the browser subscribes with. Null while reminders aren't set up.
practiceRoutes.get("/push-config", (c) => c.json({ publicKey: vapidConfig()?.publicKey ?? null }));

practiceRoutes.post("/push-subscriptions", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Sign in to get reminders when the app is closed." }, 401);
  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const parsed = parseSubscriptionBody(body);
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);
  await saveSubscription({ userId: verified.record._id.toString(), ...parsed.value });
  return c.json({ ok: true });
});

practiceRoutes.delete("/push-subscriptions", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  const body = await readJsonObject(c);
  const endpoint = pushEndpoint(body?.endpoint);
  if (!endpoint) return c.json({ error: "A push endpoint is required." }, 400);
  await removeSubscription(verified.record._id.toString(), endpoint);
  return c.json({ ok: true });
});

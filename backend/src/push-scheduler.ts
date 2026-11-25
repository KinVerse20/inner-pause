import { sendNotification, setVapidDetails, WebPushError } from "web-push";

import { claimReminder, deactivateSubscription, listActiveSubscriptions, releaseReminder } from "./push-store";
import { dueLocalDate, reminderMessage } from "./reminders";

// Sends due Practice reminders by web push, once a minute, from this same
// process (one server, like the render worker). Each send is claimed first
// (push-store.ts), so it's safe to run on more than one server too.

const TICK_MS = 60 * 1000;

/** The VAPID key pair (generate once: `npx web-push generate-vapid-keys`). Null when not set up. */
export function vapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:support@theinnerpause.com";
  return { publicKey, privateKey, subject };
}

export async function sendDueReminders(now = new Date()) {
  let sent = 0;
  let failed = 0;
  for (const subscription of await listActiveSubscriptions()) {
    const localDate = dueLocalDate(subscription, now);
    if (!localDate || !(await claimReminder(subscription.endpoint, localDate))) continue;
    try {
      await sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys },
        JSON.stringify(reminderMessage(subscription.pathId, localDate)),
        { TTL: 60 * 60, urgency: "normal" },
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      const status = error instanceof WebPushError ? error.statusCode : undefined;
      if (status === 404 || status === 410) {
        // Unsubscribed or expired on the device: stop trying.
        await deactivateSubscription(subscription.endpoint);
      } else {
        await releaseReminder(subscription.endpoint, localDate, subscription.lastSentLocalDate);
        console.error("[reminders] send failed:", status ?? (error instanceof Error ? error.message : error));
      }
    }
  }
  return { sent, failed };
}

export function startReminderScheduler() {
  const config = vapidConfig();
  if (!config) {
    console.log("[reminders] off: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to send Practice reminders.");
    return;
  }
  setVapidDetails(config.subject, config.publicKey, config.privateKey);
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { sent, failed } = await sendDueReminders();
      if (sent || failed) console.log(`[reminders] sent ${sent}, failed ${failed}`);
    } catch (error) {
      console.error("[reminders] tick failed:", error instanceof Error ? error.message : error);
    } finally {
      running = false;
    }
  };
  void tick();
  setInterval(tick, TICK_MS).unref();
  console.log("[reminders] on");
}

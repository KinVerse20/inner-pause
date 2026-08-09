import { readConfig } from "../config/env.js";

interface EventBridgeScheduledEvent {
  id?: string;
  time?: string;
  source?: string;
  "detail-type"?: string;
}

export async function handler(event: EventBridgeScheduledEvent) {
  const config = readConfig();
  console.info("InnerPause schedule handler invoked", {
    eventId: event.id,
    time: event.time,
    source: event.source,
    detailType: event["detail-type"],
  });

  if (config.notificationsMode === "disabled") {
    return {
      queued: 0,
      skipped: "Notifications are disabled for this AWS test environment.",
    };
  }

  if (config.notificationsMode === "whatsapp" && !config.approvedTestRecipient) {
    throw new Error("Scheduled notification sending requires APPROVED_TEST_RECIPIENT.");
  }

  return {
    queued: 0,
    skipped: "Scheduled notification lookup is not enabled until notification preferences are deployment-tested.",
  };
}

import { readConfig } from "../config/env.js";
import * as webpush from 'web-push';
import type { PrivateDbActionResult } from '../internal/private-db-contract.js';
import { invokeLambdaJson } from '../runtime/lambda-invoke.js';
import { readSecretString } from '../runtime/secrets.js';

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

  if (config.notificationsMode === 'web-push') {
    if (!config.region || !config.privateDbLambdaName || !config.webPushVapidSecretArn) throw new Error('Web Push scheduling is not fully configured.');
    const [publicKey, privateKey] = await Promise.all([
      readSecretString({ region: config.region, secretArn: config.webPushVapidSecretArn, jsonKey: 'VAPID_PUBLIC_KEY' }),
      readSecretString({ region: config.region, secretArn: config.webPushVapidSecretArn, jsonKey: 'VAPID_PRIVATE_KEY' }),
    ]);
    webpush.setVapidDetails(config.webPushVapidSubject, publicKey, privateKey);
    const due = await invokeLambdaJson<PrivateDbActionResult>({ functionName: config.privateDbLambdaName, region: config.region, payload: { action: 'listDuePracticeReminders' } });
    let sent = 0; let failed = 0;
    for (const reminder of due.reminders ?? []) {
      try {
        await webpush.sendNotification({ endpoint: reminder.endpoint, keys: { p256dh: reminder.p256dh, auth: reminder.auth } }, JSON.stringify({
          title: 'Your Inner Pause Practice is ready',
          body: reminderCopy(reminder.issueId),
          tag: `practice-${reminder.practiceId}-${reminder.localDate}`,
          url: '/?open=practice',
        }), { TTL: 3600, urgency: 'normal' });
        await invokeLambdaJson({ functionName: config.privateDbLambdaName, region: config.region, payload: { action: 'markPracticeReminderSent', practiceId: reminder.practiceId, localDate: reminder.localDate } });
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error('Practice reminder failed', { practiceId: reminder.practiceId, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return { queued: due.reminders?.length ?? 0, sent, failed };
  }

  return {
    queued: 0,
    skipped: "Scheduled notification lookup is not enabled until notification preferences are deployment-tested.",
  };
}

function reminderCopy(issueId: string) {
  const names: Record<string, string> = { anxiety: 'steadiness', confidence: 'confidence', focus: 'focus', reactivity: 'calm response', sleep: 'rest' };
  return `A few minutes for your ${names[issueId] || 'daily'} Practice. Small steps count.`;
}

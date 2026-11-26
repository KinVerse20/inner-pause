'use client';

import { apiFetch } from "@/lib/api";
import { activeProgramme, readProgrammeState } from "@/lib/programme-storage";

// Daily Practice reminders by web push (Kinverse's feature, on our backend:
// backend/src/routes/practice.ts sends them at your time, in your time
// zone). One reminder per device. Signed out, the choice waits on the
// device and connects after sign-in (connectPendingReminder).

export interface ReminderSetupResult {
  permission: NotificationPermission | 'unsupported';
  pushReady: boolean;
  /** Saved on the device; connects at the next sign-in. */
  waitingForSignIn?: boolean;
  message: string;
}

const PENDING_KEY = 'inner-pause:pending-reminder';
const SUBSCRIBE_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (error: unknown) => { window.clearTimeout(timer); reject(error); },
    );
  });
}

interface ReminderRequest {
  pathId: string;
  reminderTime: string;
  /** The task your last day gave you: the reminder asks about it. */
  task?: string;
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(character => character.charCodeAt(0)));
}

export function notificationSupport() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

async function pushPublicKey(): Promise<string | null> {
  try {
    const response = await apiFetch('/api/practice/push-config');
    if (!response.ok) return null;
    const payload = (await response.json()) as { publicKey?: string | null };
    return payload.publicKey ?? null;
  } catch {
    return null;
  }
}

async function pushRegistration() {
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
}

/** Sends this device's subscription to the server. "signed-out" when there's no session. */
async function sendSubscription(subscription: PushSubscription, request: ReminderRequest): Promise<'ok' | 'signed-out'> {
  const response = await apiFetch('/api/practice/push-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      pathId: request.pathId,
      reminderTime: request.reminderTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(request.task ? { task: request.task } : {}),
    }),
  });
  if (response.status === 401) return 'signed-out';
  if (!response.ok) throw new Error('The reminder could not be connected. Your path is still saved.');
  return 'ok';
}

export async function enableProgrammeReminder(request: ReminderRequest): Promise<ReminderSetupResult> {
  if (!notificationSupport()) return { permission: 'unsupported', pushReady: false, message: 'This browser can’t show reminders. Your path is saved.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { permission, pushReady: false, message: 'Notifications are off. You can turn them on later in your browser settings.' };

  const publicKey = await pushPublicKey();
  if (!publicKey) return { permission, pushReady: false, message: 'Your reminder time is saved. Reminders aren’t switched on for Inner Pause yet.' };

  // A push service can stall or refuse; starting the path never waits on it.
  let subscription: PushSubscription;
  try {
    subscription = await withTimeout((async () => {
      const registration = await pushRegistration();
      return (await registration.pushManager.getSubscription()) ?? (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
    })(), SUBSCRIBE_TIMEOUT_MS);
  } catch {
    return { permission, pushReady: false, message: 'This browser couldn’t set up reminders. Your path is saved.' };
  }

  if ((await sendSubscription(subscription, request)) === 'signed-out') {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(request));
    return { permission, pushReady: false, waitingForSignIn: true, message: 'Your reminder is saved. Sign in to get it when the app is closed.' };
  }
  window.localStorage.removeItem(PENDING_KEY);
  return { permission, pushReady: true, message: `Your daily reminder is on for ${request.reminderTime}.` };
}

/** After sign-in: connects a reminder chosen while signed out. Quiet if there's nothing to do. */
export async function connectPendingReminder() {
  if (!notificationSupport() || Notification.permission !== 'granted') return;
  const raw = window.localStorage.getItem(PENDING_KEY);
  if (!raw) return;
  try {
    const request = JSON.parse(raw) as ReminderRequest;
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription && (await sendSubscription(subscription, request)) === 'ok') window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // Tried again at the next sign-in.
  }
}

/**
 * A day done: the reminder now asks about the task it gave. Only updates a
 * reminder this device already has; never asks for permission.
 */
export async function updateReminderTask(request: ReminderRequest) {
  if (!notificationSupport() || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) await sendSubscription(subscription, request);
  } catch {
    // The reminder still comes, with its usual words.
  }
}

/** Stops this device's reminder (a finished path, Practice notifications off). */
export async function disableProgrammeReminder() {
  window.localStorage.removeItem(PENDING_KEY);
  if (!notificationSupport()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await apiFetch('/api/practice/push-subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
    await subscription.unsubscribe();
  } catch {
    // Nothing more to stop.
  }
}

/**
 * You → Notifications → Practice: off stops this device's reminder; on
 * brings it back for the path you're on, if it had one.
 */
export async function followPracticeNotificationsSetting(enabled: boolean) {
  if (!enabled) return disableProgrammeReminder();
  const current = activeProgramme(readProgrammeState());
  if (!current || current.status !== 'active') return;
  if (!notificationSupport() || Notification.permission !== 'granted') return;
  await enableProgrammeReminder({ pathId: current.issueId, reminderTime: current.reminderTime }).catch(() => undefined);
}

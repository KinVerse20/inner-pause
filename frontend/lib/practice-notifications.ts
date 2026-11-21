'use client';

export interface ReminderSetupResult {
  permission: NotificationPermission | 'unsupported';
  pushReady: boolean;
  message: string;
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(character => character.charCodeAt(0)));
}

export function notificationSupport() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export async function enablePracticeReminder(input: { issueId: string; reminderTime: string }): Promise<ReminderSetupResult> {
  if (!notificationSupport()) return { permission: 'unsupported', pushReady: false, message: 'Notifications are not supported in this browser.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { permission, pushReady: false, message: 'Notifications are off. You can enable them later in your browser settings.' };

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

  if (!publicKey || !registration.pushManager) {
    await registration.showNotification('Inner Pause reminders are ready', {
      body: `Your ${input.reminderTime} Practice reminder is saved on this device. Closed-app delivery will activate with the production push key.`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'innerpause-practice-ready',
      data: { url: '/?open=practice' },
    });
    return { permission, pushReady: false, message: 'Reminder permission is on. Production push delivery will activate when the app is deployed.' };
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
  const token = window.localStorage.getItem('innerpause-aws-id-token');
  if (!apiBase || !token) {
    window.localStorage.setItem('innerpause-pending-push-subscription', JSON.stringify({
      subscription: subscription.toJSON(), issueId: input.issueId, reminderTime: input.reminderTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }));
    return { permission, pushReady: false, message: 'Reminder permission is on. Sign in after deployment to enable closed-app delivery.' };
  }

  const response = await fetch(`${apiBase}/practices/push-subscriptions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      subscription: subscription.toJSON(), issueId: input.issueId, reminderTime: input.reminderTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  if (!response.ok) throw new Error('The reminder could not be connected. Your Practice was still saved.');
  return { permission, pushReady: true, message: 'Daily closed-app reminders are on.' };
}

# Practice PWA reminders

The frontend is installable and the service worker handles `push` and `notificationclick` events. The Practice setup stores the user's local reminder time and timezone and subscribes through the browser Push API when `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is configured.

Production activation requires:

1. Generate one VAPID key pair and keep the private key in AWS Secrets Manager.
2. Expose the public key to the frontend as `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
3. Run migration `004_practice_and_web_push.sql`.
4. Add the authenticated `POST /api/v1/practices/push-subscriptions` endpoint to store the endpoint, `p256dh`, auth secret, reminder time and IANA timezone.
5. Run an EventBridge Scheduler job once per minute. It should select reminders due in each user's timezone, send Web Push, and atomically update `last_reminder_local_date` so a retry cannot send twice.
6. Treat HTTP 404 or 410 from the push service as an expired subscription and mark it inactive.

Localhost can test permission, service-worker display, offline caching and notification-click navigation. Reliable closed-app delivery requires stable HTTPS hosting and the AWS scheduler; it cannot be proven by a local tunnel that may disappear.

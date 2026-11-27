import { APP_NAME, SUPPORT_EMAIL } from "@inner-pause/shared";

import { mailerConfigured, sendMail } from "./mailer";
import { usersCollection } from "./mongo";

// "Your Pass ends soon" emails (docs/COMMERCIAL_PLAN.md C1): 7 days and
// 1 day before a yearly Pass ends. Nothing renews by itself, so this is how
// people know to pay for another year. Checked hourly from this process;
// each email is claimed on the user record first, so it goes once even with
// more than one server.

const TICK_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Days before the end date that an email goes out, furthest first. */
export const REMINDER_DAYS = [7, 1] as const;

/** Which reminder is due `daysLeft` before the end (7 or 1), or null for none yet. */
export function reminderDue(endsAt: Date, now = new Date()): number | null {
  const left = endsAt.getTime() - now.getTime();
  if (left <= 0) return null;
  const due = REMINDER_DAYS.filter((days) => left <= days * DAY_MS);
  return due.length ? Math.min(...due) : null;
}

const dateLabel = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export async function sendPassReminders(now = new Date(), appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") {
  if (!mailerConfigured()) return { sent: 0 };
  const users = await usersCollection();
  const soon = await users
    .find({ passLifetime: { $ne: true }, passExpiresAt: { $gt: now, $lte: new Date(now.getTime() + REMINDER_DAYS[0] * DAY_MS) } })
    .toArray();
  let sent = 0;
  for (const user of soon) {
    const endsAt = user.passExpiresAt!;
    const days = reminderDue(endsAt, now);
    if (days === null) continue;
    // Claim it: not yet sent for this end date, or only an earlier (further out) one.
    const claimed = await users.updateOne(
      {
        _id: user._id,
        passExpiresAt: endsAt,
        $or: [{ passReminderSentFor: { $ne: endsAt } }, { passReminderDays: { $gt: days } }],
      },
      { $set: { passReminderSentFor: endsAt, passReminderDays: days } },
    );
    if (claimed.modifiedCount === 0) continue;
    const when = days === 1 ? "tomorrow" : `on ${dateLabel(endsAt)}`;
    const link = `${appUrl.replace(/\/$/, "")}/profile/pass`;
    try {
      await sendMail({
        to: user.email,
        subject: `Your ${APP_NAME} Pass ends ${when}`,
        text: [
          `Hi${user.fullName ? ` ${user.fullName.split(" ")[0]}` : ""},`,
          "",
          `Your ${APP_NAME} Pass ends ${when}. It doesn't renew by itself.`,
          "",
          `To keep your Pauses going, get another year here: ${link}`,
          "",
          "Your journal and everything you've saved stay with your account either way.",
          "",
          `Questions? Write to ${SUPPORT_EMAIL}.`,
        ].join("\n"),
      });
      sent += 1;
    } catch (error) {
      // Let a later tick try again.
      await users.updateOne({ _id: user._id }, { $unset: { passReminderSentFor: "", passReminderDays: "" } });
      console.error("[pass] reminder email failed:", error instanceof Error ? error.message : error);
    }
  }
  return { sent };
}

export function startPassReminders() {
  if (!mailerConfigured()) {
    console.log("[pass] reminder emails off: set SMTP_HOST and MAIL_FROM to send them.");
    return;
  }
  const tick = () => void sendPassReminders().catch((error) => console.error("[pass] reminders failed:", error instanceof Error ? error.message : error));
  tick();
  setInterval(tick, TICK_MS).unref();
}

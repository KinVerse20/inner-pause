import { APP_NAME } from "@inner-pause/shared";
import { Hono } from "hono";
import { ObjectId } from "mongodb";

import { getAdmin } from "../admin/admins";
import { hashPassword } from "../auth/password";
import { normalizeEmail, updateUserPassword } from "../auth/users";
import {
  BUG_REWARD_DAYS,
  BUG_STATUSES,
  MAX_ADMIN_NOTE_LENGTH,
  claimBugReward,
  findBugReport,
  listBugReports,
  recordBugReward,
  releaseBugReward,
  setBugStatus,
  type BugReportDocument,
  type BugStatus,
} from "../bug-store";
import { readJsonObject, stringField } from "../http";
import { mailerConfigured, sendMail } from "../mailer";
import { getDb, usersCollection, type UserDocument } from "../mongo";
import { extendPass, passStateOf } from "../pass-store";
import { streamFile } from "./sounds";

// The founder's tools (docs/COMMERCIAL_PLAN.md C7): review bug reports, and
// give a month of Pass for a real one, or by hand. Only ADMIN_EMAILS.

export const adminRoutes = new Hono<{ Variables: { adminEmail: string } }>();

const notFound = { error: "Not found." };

async function logGrant(entry: { userId: ObjectId; days: number; reason: string; by: string; until: Date; bugReportId?: ObjectId }) {
  await (await getDb()).collection("pass_grants").insertOne({ ...entry, createdAt: new Date() });
}

async function emailReward(email: string, until: Date, days: number, why: string) {
  if (!mailerConfigured() || !email) return;
  const date = until.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const added = days === BUG_REWARD_DAYS ? "a month" : `${days} days`;
  await sendMail({
    to: email,
    subject: `${added[0].toUpperCase()}${added.slice(1)} of ${APP_NAME} Pass, on us`,
    text: [...(why ? [why, ""] : []), `We've added ${added} to your Pass. It now runs until ${date}.`].join("\n"),
  }).catch((error) => console.error("[admin] reward email failed:", error instanceof Error ? error.message : error));
}

const publicReport = (report: BugReportDocument) => ({
  id: report._id.toString(),
  userId: report.userId,
  userEmail: report.userEmail,
  userName: report.userName,
  description: report.description,
  page: report.page,
  userAgent: report.userAgent,
  hasScreenshot: Boolean(report.screenshotKey),
  status: report.status,
  createdAt: report.createdAt.toISOString(),
  rewardedAt: report.rewardedAt?.toISOString() ?? null,
  rewardedUntil: report.rewardedUntil?.toISOString() ?? null,
  adminNote: report.adminNote ?? null,
  reviewedAt: report.reviewedAt?.toISOString() ?? null,
});

const REJECTED_LABEL: Partial<Record<BugStatus, string>> = { "not-a-bug": "isn't a bug", duplicate: "was already reported" };

async function emailRejection(email: string, status: BugStatus, note: string) {
  if (!mailerConfigured() || !email) return;
  await sendMail({
    to: email,
    subject: `About the bug you reported to ${APP_NAME}`,
    text: [`Thank you for taking the time to report it. We looked into it, and it ${REJECTED_LABEL[status] ?? "has been reviewed"}.`, "", note, "", "You can see all your reports in the app: You, then Report a bug."].join("\n"),
  }).catch((error) => console.error("[admin] rejection email failed:", error instanceof Error ? error.message : error));
}

// Every route here answers 404 to anyone but an admin, so it doesn't show it exists.
adminRoutes.use("*", async (c, next) => {
  const admin = await getAdmin(c);
  if (!admin) return c.json(notFound, 404);
  c.set("adminEmail", admin.record.email);
  await next();
});

adminRoutes.get("/me", (c) => c.json({ admin: true }));

adminRoutes.get("/bugs", async (c) => {
  const status = c.req.query("status");
  const filter = status && (BUG_STATUSES as readonly string[]).includes(status) ? (status as BugStatus) : undefined;
  return c.json({ reports: (await listBugReports(filter)).map(publicReport) });
});

adminRoutes.get("/bugs/:id/screenshot", async (c) => {
  const report = await findBugReport(c.req.param("id"));
  if (!report?.screenshotKey || !report.screenshotType) return c.json(notFound, 404);
  return streamFile(c, report.screenshotKey, report.screenshotType, "private, no-store");
});

// Marking a report Valid gives its user a month of Pass, once per report.
adminRoutes.post("/bugs/:id/status", async (c) => {
  const body = await readJsonObject(c);
  const status = stringField(body?.status, 20) as BugStatus;
  if (!(BUG_STATUSES as readonly string[]).includes(status)) return c.json({ error: "Unknown status." }, 400);
  // The user sees this note with the report: a reason is needed to turn one down.
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, MAX_ADMIN_NOTE_LENGTH) : "";
  if ((status === "not-a-bug" || status === "duplicate") && !note) return c.json({ error: "Write a reason the user will see." }, 400);
  const before = await setBugStatus(c.req.param("id"), status, note || undefined);
  if (!before) return c.json(notFound, 404);
  if ((status === "not-a-bug" || status === "duplicate") && before.status !== status) await emailRejection(before.userEmail, status, note);

  let rewarded = false;
  if (status === "valid" && before.userId && ObjectId.isValid(before.userId)) {
    const by = c.get("adminEmail");
    if (await claimBugReward(before._id, by)) {
      const userId = new ObjectId(before.userId);
      const until = await extendPass(userId, BUG_REWARD_DAYS);
      if (until) {
        await recordBugReward(before._id, until);
        await logGrant({ userId, days: BUG_REWARD_DAYS, reason: "Valid bug report", by, until, bugReportId: before._id });
        await emailReward(before.userEmail, until, BUG_REWARD_DAYS, "Thank you. The bug you reported was real, and we're fixing it.");
        rewarded = true;
      } else {
        // The account is gone: nothing to give, and the claim is let go.
        await releaseBugReward(before._id);
      }
    }
  }
  const report = await findBugReport(c.req.param("id"));
  return c.json({ report: report ? publicReport(report) : null, rewarded });
});

// Find a user by email (exact) or by part of their email or name. With no
// search, the newest 20 accounts.
adminRoutes.get("/users", async (c) => {
  const query = (c.req.query("q") ?? "").trim();
  const users = await usersCollection();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter =
    query.length < 2
      ? {}
      : { $or: [{ email: normalizeEmail(query) }, { email: { $regex: escaped, $options: "i" } }, { fullName: { $regex: escaped, $options: "i" } }, { phone: query }] };
  const found = await users.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
  return c.json({
    users: found.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt.toISOString(),
      pass: passStateOf(user),
    })),
  });
});

// Give a user days of Pass by hand (support cases). 30 by default.
adminRoutes.post("/users/:id/extend", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json(notFound, 404);
  const body = (await readJsonObject(c)) ?? {};
  const days = typeof body.days === "number" && Number.isInteger(body.days) ? body.days : 30;
  if (days < 1 || days > 366) return c.json({ error: "Between 1 and 366 days." }, 400);
  const reason = stringField(body.reason, 300)?.trim() || "Given by hand";
  const userId = new ObjectId(id);
  const until = await extendPass(userId, days);
  if (!until) return c.json(notFound, 404);
  const by = c.get("adminEmail");
  await logGrant({ userId, days, reason, by, until });
  const user = await (await usersCollection()).findOne({ _id: userId });
  if (user && body.notify === true) await emailReward(user.email, until, days, "");
  return c.json({ pass: user ? passStateOf(user) : null, days });
});

// One account in full: what the server holds for it. (Pauses, the journal
// and Moments live on the person's phone; only an encrypted journal backup,
// if they turned it on, is here, and it stays unreadable to us.)
adminRoutes.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json(notFound, 404);
  const user = await (await usersCollection()).findOne({ _id: new ObjectId(id) });
  if (!user) return c.json(notFound, 404);
  return c.json({ user: await accountView(user) });
});

async function accountView(user: UserDocument & { _id: ObjectId }) {
  const db = await getDb();
  const id = user._id.toString();
  const [orders, grants, bugs, journalBackups, reminders, changes] = await Promise.all([
    db.collection("pass_orders").find({ userId: id }).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection("pass_grants").find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection("bug_reports").find({ userId: id }).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection("journal_entries").countDocuments({ userId: id }),
    db.collection("push_subscriptions").countDocuments({ userId: id }),
    db.collection("admin_changes").find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).toArray(),
  ]);
  const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : null);
  return {
    id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
    updatedAt: iso(user.updatedAt),
    signupSource: user.signupSource ?? null,
    pass: passStateOf(user),
    passExpiresAt: iso(user.passExpiresAt),
    passLifetime: Boolean(user.passLifetime),
    trialPauseIds: user.trialPauseIds ?? [],
    journalBackups,
    reminders,
    orders: orders.map((order) => ({ id: String(order._id), amount: order.amount, status: order.status, paymentId: order.paymentId ?? null, createdAt: iso(order.createdAt), paidAt: iso(order.paidAt) })),
    grants: grants.map((grant) => ({ days: grant.days, reason: grant.reason, by: grant.by, until: iso(grant.until), createdAt: iso(grant.createdAt) })),
    bugReports: bugs.map((report) => ({ id: String(report._id), description: report.description, status: report.status, createdAt: iso(report.createdAt) })),
    changes: changes.map((change) => ({ by: change.by, fields: change.fields, createdAt: iso(change.createdAt) })),
  };
}

const MAX_NAME = 80;
const MAX_PHONE = 30;
const MAX_EMAIL = 254;
const MAX_PASSWORD = 200;

// Change an account: name, phone, email, the Pass (end date or lifetime),
// the trial (start it again), a new password, or sign them out everywhere.
// Each change is logged in admin_changes with who made it (never a password).
adminRoutes.patch("/users/:id", async (c) => {
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json(notFound, 404);
  const userId = new ObjectId(id);
  const users = await usersCollection();
  const before = await users.findOne({ _id: userId });
  if (!before) return c.json(notFound, 404);
  const body = await readJsonObject(c);
  if (!body) return c.json({ error: "Nothing to change." }, 400);

  const set: Partial<UserDocument> = {};
  const unset: Record<string, ""> = {};
  const fields: Record<string, { from: unknown; to: unknown }> = {};
  const note = (field: string, from: unknown, to: unknown) => {
    if (JSON.stringify(from ?? null) !== JSON.stringify(to ?? null)) fields[field] = { from: from ?? null, to: to ?? null };
  };

  if (typeof body.fullName === "string") {
    const fullName = body.fullName.trim().slice(0, MAX_NAME);
    note("fullName", before.fullName, fullName);
    set.fullName = fullName;
  }
  if (typeof body.phone === "string") {
    const phone = body.phone.trim().slice(0, MAX_PHONE);
    note("phone", before.phone, phone);
    set.phone = phone;
  }
  if (typeof body.email === "string") {
    const email = normalizeEmail(body.email);
    if (!email.includes("@") || email.length > MAX_EMAIL) return c.json({ error: "That email doesn't look right." }, 400);
    if (email !== before.email) {
      if (await users.findOne({ email, _id: { $ne: userId } })) return c.json({ error: "Another account already uses this email." }, 409);
      note("email", before.email, email);
      set.email = email;
    }
  }
  if ("passExpiresAt" in body) {
    if (body.passExpiresAt === null) {
      note("passExpiresAt", before.passExpiresAt?.toISOString(), null);
      unset.passExpiresAt = "";
    } else {
      const end = typeof body.passExpiresAt === "string" ? new Date(body.passExpiresAt) : null;
      if (!end || Number.isNaN(end.getTime())) return c.json({ error: "The Pass end date isn't a date." }, 400);
      note("passExpiresAt", before.passExpiresAt?.toISOString(), end.toISOString());
      set.passExpiresAt = end;
      if (!before.passActivatedAt) set.passActivatedAt = new Date();
    }
    // A new end date gets its own "ends soon" emails.
    unset.passReminderSentFor = "";
    unset.passReminderDays = "";
  }
  if (typeof body.passLifetime === "boolean") {
    note("passLifetime", Boolean(before.passLifetime), body.passLifetime);
    set.passLifetime = body.passLifetime;
  }
  if (body.resetTrial === true) {
    note("trialPauseIds", before.trialPauseIds ?? [], []);
    unset.trialPauseIds = "";
  }
  if (typeof body.newPassword === "string") {
    if (body.newPassword.length < 6 || body.newPassword.length > MAX_PASSWORD) return c.json({ error: "A password needs at least 6 characters." }, 400);
    fields.password = { from: "(hidden)", to: "(changed)" };
  }
  if (body.signOut === true) fields.signedOut = { from: null, to: true };

  if (Object.keys(fields).length === 0) return c.json({ user: await accountView(before), changed: [] });

  // Don't unset what is also being set.
  for (const key of Object.keys(set)) delete unset[key];
  await users.updateOne({ _id: userId }, { $set: { ...set, updatedAt: new Date() }, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
  // A new password signs them out everywhere (updateUserPassword); so does signOut.
  if (typeof body.newPassword === "string") await updateUserPassword(id, await hashPassword(body.newPassword));
  else if (body.signOut === true) await users.updateOne({ _id: userId }, { $set: { passwordChangedAt: new Date() } });

  await (await getDb()).collection("admin_changes").insertOne({ userId, by: c.get("adminEmail"), fields, createdAt: new Date() });
  const after = await users.findOne({ _id: userId });
  return c.json({ user: after ? await accountView(after) : null, changed: Object.keys(fields) });
});

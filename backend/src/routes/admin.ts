import { APP_NAME } from "@inner-pause/shared";
import { Hono } from "hono";
import { ObjectId } from "mongodb";

import { getAdmin } from "../admin/admins";
import { normalizeEmail } from "../auth/users";
import {
  BUG_REWARD_DAYS,
  BUG_STATUSES,
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
import { getDb, usersCollection } from "../mongo";
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
});

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
  const before = await setBugStatus(c.req.param("id"), status);
  if (!before) return c.json(notFound, 404);

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

// Find a user by email (exact) or by part of their email or name.
adminRoutes.get("/users", async (c) => {
  const query = (c.req.query("q") ?? "").trim();
  if (query.length < 2) return c.json({ users: [] });
  const users = await usersCollection();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = await users
    .find({ $or: [{ email: normalizeEmail(query) }, { email: { $regex: escaped, $options: "i" } }, { fullName: { $regex: escaped, $options: "i" } }, { phone: query }] })
    .limit(20)
    .toArray();
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

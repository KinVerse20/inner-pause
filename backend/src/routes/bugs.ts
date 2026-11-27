import { APP_NAME } from "@inner-pause/shared";
import { Hono } from "hono";

import { adminEmails } from "../admin/admins";
import { getVerifiedSession } from "../auth/session";
import { createBugReport, imageTypeOf, listBugReportsOf, MAX_DESCRIPTION_LENGTH, MAX_SCREENSHOT_BYTES } from "../bug-store";
import { mailerConfigured, sendMail } from "../mailer";
import { countRecent, recordEvent } from "../rate-limit";

export const bugRoutes = new Hono();

const DAY_MS = 24 * 60 * 60 * 1000;
const REPORTS_PER_DAY = 10;

// Your own reports and where each stands: under review, accepted (and the
// month it gave), or turned down with the admin's reason.
bugRoutes.get("/mine", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Sign in to see your reports." }, 401);
  const reports = await listBugReportsOf(verified.record._id.toString());
  return c.json({
    reports: reports.map((report) => ({
      id: report._id.toString(),
      description: report.description,
      hasScreenshot: Boolean(report.screenshotKey),
      status: report.status,
      note: report.adminNote ?? null,
      createdAt: report.createdAt.toISOString(),
      reviewedAt: report.reviewedAt?.toISOString() ?? null,
      rewardedUntil: report.rewardedUntil?.toISOString() ?? null,
    })),
  });
});

// Report a bug (docs/COMMERCIAL_PLAN.md C6): multipart form with
// `description`, optional `screenshot` (an image, up to 5 MB) and `page`.
bugRoutes.post("/", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Sign in to report a bug, so we can thank you for it." }, 401);
  const userId = verified.record._id.toString();
  const limitKey = `bug-report:${userId}`;
  if (countRecent(limitKey, DAY_MS) >= REPORTS_PER_DAY) {
    return c.json({ error: "That's a lot of reports for one day. Thank you! Please send more tomorrow." }, 429);
  }

  let form: Record<string, string | File | (string | File)[]>;
  try {
    form = await c.req.parseBody();
  } catch {
    return c.json({ error: "The report couldn't be read. Please try again." }, 400);
  }
  const description = typeof form.description === "string" ? form.description.trim() : "";
  if (description.length < 5) return c.json({ error: "Tell us a little about what happened." }, 400);
  if (description.length > MAX_DESCRIPTION_LENGTH) return c.json({ error: `Please keep it under ${MAX_DESCRIPTION_LENGTH} characters.` }, 400);
  const page = typeof form.page === "string" ? form.page.slice(0, 300) : "";

  let screenshot: { bytes: Buffer; mime: string; ext: string } | undefined;
  const file = form.screenshot;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_SCREENSHOT_BYTES) return c.json({ error: "The screenshot is over 5 MB. Please send a smaller one." }, 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = imageTypeOf(bytes);
    if (!type) return c.json({ error: "The screenshot needs to be an image (PNG, JPG, WebP or HEIC)." }, 415);
    screenshot = { bytes, ...type };
  }

  const report = await createBugReport({
    userId,
    userEmail: verified.record.email,
    userName: verified.record.fullName,
    description,
    page,
    userAgent: (c.req.header("user-agent") ?? "").slice(0, 300),
    screenshot,
  });
  recordEvent(limitKey, DAY_MS);

  const notify = adminEmails();
  if (mailerConfigured() && notify.length) {
    const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    sendMail({
      to: notify.join(", "),
      replyTo: verified.record.email,
      subject: `${APP_NAME} bug report from ${verified.record.fullName || verified.record.email}`,
      text: [
        description,
        "",
        `From: ${verified.record.fullName} <${verified.record.email}>`,
        `Page: ${page || "not given"}`,
        `Screenshot: ${screenshot ? "yes" : "no"}`,
        "",
        `Review it: ${appUrl}/admin`,
      ].join("\n"),
    }).catch((error) => console.error("[bugs] notice email failed:", error instanceof Error ? error.message : error));
  }

  return c.json({ id: report._id.toString() }, 201);
});

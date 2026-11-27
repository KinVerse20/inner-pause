import { randomUUID } from "node:crypto";

import { ObjectId, type Collection } from "mongodb";

import { fileStore } from "./file-store";
import { getDb } from "./mongo";

// Bug reports (docs/COMMERCIAL_PLAN.md C6): what happened, in the user's
// words, with an optional screenshot. A report the founder marks Valid gives
// its user one month of Pass, once (C7, routes/admin.ts).

export const BUG_STATUSES = ["new", "valid", "not-a-bug", "duplicate"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
export const MAX_DESCRIPTION_LENGTH = 4000;
/** Days of Pass a Valid report gives. */
export const BUG_REWARD_DAYS = 30;

export interface BugReportDocument {
  _id: ObjectId;
  /** Cleared (null) if the account is deleted; the report stays. */
  userId: string | null;
  userEmail: string;
  userName: string;
  description: string;
  /** Where in the app it happened, and on what (filled in by the app). */
  page: string;
  userAgent: string;
  screenshotKey?: string;
  screenshotType?: string;
  status: BugStatus;
  createdAt: Date;
  updatedAt: Date;
  /** Set once, when a Valid report's month was given. */
  rewardedAt?: Date;
  rewardedBy?: string;
  /** The user's Pass end date after the reward. */
  rewardedUntil?: Date;
}

export async function bugReportsCollection(): Promise<Collection<BugReportDocument>> {
  return (await getDb()).collection<BugReportDocument>("bug_reports");
}

/** The image type from its first bytes (never trust the browser's claim), or null. */
export function imageTypeOf(bytes: Uint8Array): { mime: string; ext: string } | null {
  const starts = (...sig: number[]) => sig.every((value, index) => bytes[index] === value);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { mime: "image/png", ext: "png" };
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (starts(0x47, 0x49, 0x46, 0x38)) return { mime: "image/gif", ext: "gif" };
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { mime: "image/webp", ext: "webp" };
  }
  // HEIC/HEIF (iPhone screenshots shared as photos): "ftyp" then a heic brand.
  const brand = String.fromCharCode(...bytes.slice(8, 12));
  if (String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" && ["heic", "heix", "mif1", "msf1", "heif"].includes(brand)) {
    return { mime: "image/heic", ext: "heic" };
  }
  return null;
}

export async function createBugReport(input: {
  userId: string;
  userEmail: string;
  userName: string;
  description: string;
  page: string;
  userAgent: string;
  screenshot?: { bytes: Buffer; mime: string; ext: string };
}) {
  const _id = new ObjectId();
  let screenshotKey: string | undefined;
  if (input.screenshot) {
    screenshotKey = `bug-reports/${_id.toString()}-${randomUUID().slice(0, 8)}.${input.screenshot.ext}`;
    await fileStore().write(screenshotKey, input.screenshot.bytes, input.screenshot.mime);
  }
  const now = new Date();
  const report: BugReportDocument = {
    _id,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    description: input.description,
    page: input.page,
    userAgent: input.userAgent,
    ...(screenshotKey ? { screenshotKey, screenshotType: input.screenshot!.mime } : {}),
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  await (await bugReportsCollection()).insertOne(report);
  return report;
}

export async function listBugReports(status?: BugStatus) {
  return (await bugReportsCollection())
    .find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
}

export async function findBugReport(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return (await bugReportsCollection()).findOne({ _id: new ObjectId(id) });
}

/** Sets a report's status. Returns the report as it was before, or null if there's none. */
export async function setBugStatus(id: string, status: BugStatus) {
  if (!ObjectId.isValid(id)) return null;
  return (await bugReportsCollection()).findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } });
}

/**
 * Claims a report's reward: true only for the first caller, so a month is
 * never given twice for one report (double click, two admins).
 */
export async function claimBugReward(id: ObjectId, by: string) {
  const result = await (await bugReportsCollection()).updateOne(
    { _id: id, rewardedAt: { $exists: false }, userId: { $ne: null } },
    { $set: { rewardedAt: new Date(), rewardedBy: by } },
  );
  return result.modifiedCount === 1;
}

export async function recordBugReward(id: ObjectId, until: Date) {
  await (await bugReportsCollection()).updateOne({ _id: id }, { $set: { rewardedUntil: until } });
}

export async function releaseBugReward(id: ObjectId) {
  await (await bugReportsCollection()).updateOne({ _id: id }, { $unset: { rewardedAt: "", rewardedBy: "" } });
}

/** Keeps reports when an account is deleted, without the link to it. */
export async function detachBugReportsFromUser(userId: string) {
  await (await bugReportsCollection()).updateMany({ userId }, { $set: { userId: null, userEmail: "", userName: "" } });
}

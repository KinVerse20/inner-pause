import { createHmac, timingSafeEqual } from "node:crypto";

import { adminEmails } from "./admin/admins";
import { PASS_DURATION_DAYS, PASS_PRICE_INR, TRIAL_PAUSES, type PassState } from "@inner-pause/shared";
import { ObjectId, type Collection } from "mongodb";

import { getDb, usersCollection, type UserDocument } from "./mongo";

// The Inner Pause Pass: one Razorpay payment for a year, held on the user's
// account (docs/COMMERCIAL_PLAN.md C1). Paying again while it's still on
// adds the year to its end date, so buying early never loses days. Passes
// bought earlier for life still read as they were. Payments are confirmed on the
// server — by the checkout's signature (/api/pass/verify) and by Razorpay's
// webhook, whichever arrives first — never by the browser alone.
//
// Configured with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (and
// RAZORPAY_WEBHOOK_SECRET for the webhook). Use rzp_test_ keys to try it
// without real money.

export const PASS_AMOUNT_PAISE = PASS_PRICE_INR * 100;

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID?.trim() ?? "";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PassFields = Pick<UserDocument, "passExpiresAt" | "passLifetime" | "trialPauseIds"> & { email?: string };

/** The trial (C2): which Pauses it has counted, and how many it allows. */
export function trialOf(user: PassFields) {
  const pauseIds = user.trialPauseIds ?? [];
  return { used: Math.min(pauseIds.length, TRIAL_PAUSES), limit: TRIAL_PAUSES, pauseIds };
}

export function passStateOf(user: PassFields): PassState {
  const trial = trialOf(user);
  // The founder's accounts (ADMIN_EMAILS) have everything, without buying.
  if (user.email && adminEmails().includes(user.email.toLowerCase())) return { status: "active", lifetime: true, expiresAt: null, trial };
  if (user.passLifetime) return { status: "active", lifetime: true, expiresAt: null, trial };
  if (!user.passExpiresAt) return { status: "none", lifetime: false, expiresAt: null, trial };
  return {
    status: user.passExpiresAt.getTime() > Date.now() ? "active" : "expired",
    lifetime: false,
    expiresAt: user.passExpiresAt.toISOString(),
    trial,
  };
}

/**
 * The end date after adding `days` to a Pass: from its current end date while
 * it's still on, otherwise from now.
 */
export function extendedExpiry(current: Date | undefined, days: number, now = new Date()) {
  const from = current && current.getTime() > now.getTime() ? current.getTime() : now.getTime();
  return new Date(from + days * DAY_MS);
}

/** Adds `days` to a user's Pass (a purchase, or a reward). Returns the new end date. */
export async function extendPass(userId: ObjectId, days: number) {
  const users = await usersCollection();
  const user = await users.findOne({ _id: userId });
  if (!user) return null;
  const passExpiresAt = extendedExpiry(user.passExpiresAt, days);
  await users.updateOne(
    { _id: userId },
    { $set: { passExpiresAt, passActivatedAt: user.passActivatedAt ?? new Date(), updatedAt: new Date() }, $unset: { passReminderSentFor: "", passReminderDays: "" } },
  );
  return passExpiresAt;
}

interface PassOrderDocument {
  /** Razorpay's order id. */
  _id: string;
  /** Cleared (null) if the account is deleted; the payment record stays. */
  userId: string | null;
  amount: number;
  currency: "INR";
  status: "created" | "paid";
  paymentId?: string;
  createdAt: Date;
  paidAt?: Date;
}

async function ordersCollection(): Promise<Collection<PassOrderDocument>> {
  return (await getDb()).collection<PassOrderDocument>("pass_orders");
}

// Overridable so tests can stand in for Razorpay.
const apiBase = () => (process.env.RAZORPAY_API_BASE ?? "https://api.razorpay.com").replace(/\/$/, "");

/** Creates a Razorpay order for one Pass and records it against the user. */
export async function createPassOrder(userId: string) {
  const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`${apiBase()}/v1/orders`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: PASS_AMOUNT_PAISE,
      currency: "INR",
      receipt: `pass-${Date.now()}`,
      notes: { userId, product: "inner-pause-pass" },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Razorpay couldn't create the order (HTTP ${response.status}).`);
  const order = (await response.json()) as { id?: string };
  if (!order.id) throw new Error("Razorpay returned no order id.");
  await (await ordersCollection()).insertOne({
    _id: order.id,
    userId,
    amount: PASS_AMOUNT_PAISE,
    currency: "INR",
    status: "created",
    createdAt: new Date(),
  });
  return { orderId: order.id, amount: PASS_AMOUNT_PAISE, currency: "INR" as const };
}

const hmacHex = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Razorpay Checkout's proof of payment: HMAC-SHA256 of "order|payment" with the key secret. */
export function isValidPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(secret) && safeEqual(hmacHex(secret!, `${orderId}|${paymentId}`), signature);
}

/** A webhook is genuine if its body, signed with the webhook secret, matches the header. */
export function isValidWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  return Boolean(secret) && safeEqual(hmacHex(secret!, rawBody), signature);
}

/**
 * Marks an order paid and gives its user a year of Pass, once per order,
 * however many times it is reported (checkout and webhook both do).
 * Returns the user's Pass, or null for an unknown order (or another user's).
 */
export async function completePassOrder(orderId: string, paymentId: string, expectedUserId?: string): Promise<PassState | null> {
  const orders = await ordersCollection();
  const order = await orders.findOne({ _id: orderId });
  if (!order || (expectedUserId !== undefined && order.userId !== expectedUserId)) return null;

  const users = await usersCollection();
  const userId = order.userId && ObjectId.isValid(order.userId) ? new ObjectId(order.userId) : null;
  // Only the first report gets to move the order from created to paid.
  const claimed = await orders.findOneAndUpdate({ _id: orderId, status: "created" }, { $set: { status: "paid", paymentId, paidAt: new Date() } });
  if (claimed && userId) await extendPass(userId, PASS_DURATION_DAYS);
  const user = userId ? await users.findOne({ _id: userId }) : null;
  return user ? passStateOf(user) : passStateOf({});
}

/** Keeps payment records when an account is deleted, without the link to it. */
export async function detachOrdersFromUser(userId: string) {
  await (await ordersCollection()).updateMany({ userId }, { $set: { userId: null } });
}

/**
 * Counts a Pause against the trial (C2), once per Pause and never past
 * TRIAL_PAUSES, in one atomic update so two devices can't both take the last
 * one. An active Pass doesn't use the trial. Returns the user's Pass and
 * whether this Pause may play: false only when the trial is used up.
 */
export async function countTrialPause(userId: ObjectId, pauseId: string): Promise<{ pass: PassState; allowed: boolean } | null> {
  const users = await usersCollection();
  const user = await users.findOne({ _id: userId });
  if (!user) return null;
  const before = passStateOf(user);
  if (before.status === "active" || before.trial.pauseIds.includes(pauseId)) return { pass: before, allowed: true };
  await users.updateOne(
    // "trialPauseIds.<n>" missing means fewer than n + 1 counted.
    { _id: userId, [`trialPauseIds.${TRIAL_PAUSES - 1}`]: { $exists: false } },
    { $addToSet: { trialPauseIds: pauseId }, $set: { updatedAt: new Date() } },
  );
  const after = await users.findOne({ _id: userId });
  const pass = passStateOf(after ?? user);
  return { pass, allowed: pass.trial.pauseIds.includes(pauseId) };
}

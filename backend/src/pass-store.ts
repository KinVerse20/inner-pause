import { createHmac, timingSafeEqual } from "node:crypto";

import { PASS_DAYS, PASS_PRICE_INR, type PassState } from "@inner-pause/shared";
import { ObjectId, type Collection } from "mongodb";

import { getDb, usersCollection, type UserDocument } from "./mongo";

// The Inner Pause Pass: a one-time Razorpay payment that unlocks Practice
// for PASS_DAYS, held on the user's account. Payments are confirmed on the
// server — by the checkout's signature (/api/pass/verify) and by Razorpay's
// webhook, whichever arrives first — never by the browser alone.
//
// Configured with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (and
// RAZORPAY_WEBHOOK_SECRET for the webhook). Use rzp_test_ keys to try it
// without real money.

export const PASS_AMOUNT_PAISE = PASS_PRICE_INR * 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID?.trim() ?? "";

export function passStateOf(user: Pick<UserDocument, "passExpiresAt">): PassState {
  if (!user.passExpiresAt) return { status: "none", expiresAt: null };
  return {
    status: user.passExpiresAt.getTime() > Date.now() ? "active" : "expired",
    expiresAt: user.passExpiresAt.toISOString(),
  };
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
 * Marks an order paid and extends its user's Pass by PASS_DAYS — once per
 * order, however many times it is reported (checkout and webhook both do).
 * Buying while a Pass is active adds the days after its current end.
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
  if (claimed && userId) {
    const user = await users.findOne({ _id: userId });
    if (user) {
      const from = Math.max(Date.now(), user.passExpiresAt?.getTime() ?? 0);
      await users.updateOne(
        { _id: userId },
        { $set: { passExpiresAt: new Date(from + PASS_DAYS * DAY_MS), passActivatedAt: user.passActivatedAt ?? new Date(), updatedAt: new Date() } },
      );
    }
  }
  const user = userId ? await users.findOne({ _id: userId }) : null;
  return user ? passStateOf(user) : { status: "none", expiresAt: null };
}

/** Keeps payment records when an account is deleted, without the link to it. */
export async function detachOrdersFromUser(userId: string) {
  await (await ordersCollection()).updateMany({ userId }, { $set: { userId: null } });
}

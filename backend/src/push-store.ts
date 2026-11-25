import type { Collection, ObjectId } from "mongodb";

import { getDb } from "./mongo";

// Practice reminder subscriptions (web push), one per device: the browser's
// push endpoint is the key, so starting another path on the same device
// moves its one reminder rather than adding a second.
export interface PushSubscriptionDocument {
  _id?: ObjectId;
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  pathId: string;
  reminderTime: string;
  timezone: string;
  active: boolean;
  /** The listener's local date of the last reminder sent: at most one a day. */
  lastSentLocalDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

let indexesReady = false;

async function subscriptions(): Promise<Collection<PushSubscriptionDocument>> {
  const collection = (await getDb()).collection<PushSubscriptionDocument>("push_subscriptions");
  if (!indexesReady) {
    await collection.createIndex({ endpoint: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ active: 1 });
    indexesReady = true;
  }
  return collection;
}

export async function saveSubscription(input: Omit<PushSubscriptionDocument, "_id" | "active" | "createdAt" | "updatedAt" | "lastSentLocalDate">) {
  const now = new Date();
  await (await subscriptions()).updateOne(
    { endpoint: input.endpoint },
    {
      $set: { ...input, active: true, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
}

/** Stops this device's reminder; only its own account can. */
export async function removeSubscription(userId: string, endpoint: string) {
  await (await subscriptions()).deleteOne({ userId, endpoint });
}

export async function removeSubscriptionsForUser(userId: string) {
  await (await subscriptions()).deleteMany({ userId });
}

export async function listActiveSubscriptions() {
  return (await subscriptions()).find({ active: true }).toArray();
}

/**
 * Claims today's reminder before sending it. Only one claim per local date
 * succeeds, so a retry or a second server never sends twice.
 */
export async function claimReminder(endpoint: string, localDate: string) {
  const result = await (await subscriptions()).updateOne(
    { endpoint, active: true, lastSentLocalDate: { $ne: localDate } },
    { $set: { lastSentLocalDate: localDate } },
  );
  return result.modifiedCount === 1;
}

/** Gives a claim back after a passing failure, so the next minute can try again. */
export async function releaseReminder(endpoint: string, localDate: string, previous: string | undefined) {
  await (await subscriptions()).updateOne(
    { endpoint, lastSentLocalDate: localDate },
    previous ? { $set: { lastSentLocalDate: previous } } : { $unset: { lastSentLocalDate: "" } },
  );
}

/** The push service says this subscription is gone (404/410). */
export async function deactivateSubscription(endpoint: string) {
  await (await subscriptions()).updateOne({ endpoint }, { $set: { active: false, updatedAt: new Date() } });
}

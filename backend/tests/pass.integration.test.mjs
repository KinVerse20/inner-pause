import test from "node:test";
import assert from "node:assert/strict";

// The yearly Pass, the 2 Pause trial and the "ends soon" emails, against a
// real MongoDB. Skips unless TEST_MONGODB_URI points at a throwaway database:
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27018/ip-pass-test npm test
const MONGO = process.env.TEST_MONGODB_URI;
const skip = MONGO ? false : "set TEST_MONGODB_URI to a throwaway database";
const DAY = 24 * 60 * 60 * 1000;

async function setup() {
  process.env.MONGODB_URI = MONGO;
  const { getDb, usersCollection, closeMongo } = await import("../src/mongo.ts");
  const store = await import("../src/pass-store.ts");
  const db = await getDb();
  await db.collection("users").deleteMany({});
  await db.collection("pass_orders").deleteMany({});
  const users = await usersCollection();
  const make = async (fields = {}) => {
    const { insertedId } = await users.insertOne({
      email: `u${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: "x",
      fullName: "Asha Rao",
      phone: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...fields,
    });
    return insertedId;
  };
  return { db, users, store, make, closeMongo };
}

test("a paid order gives a year; paying again early adds a year to the end date", { skip }, async () => {
  const { db, users, store, make, closeMongo } = await setup();
  try {
    const id = await make();
    const order = async (orderId) =>
      db.collection("pass_orders").insertOne({ _id: orderId, userId: id.toString(), amount: 100000, currency: "INR", status: "created", createdAt: new Date() });

    await order("order_1");
    const first = await store.completePassOrder("order_1", "pay_1");
    assert.equal(first.status, "active");
    assert.equal(first.lifetime, false);
    const firstEnd = Date.parse(first.expiresAt);
    assert.ok(Math.abs(firstEnd - (Date.now() + 365 * DAY)) < 60_000, "ends a year from now");

    // The webhook reporting the same order again changes nothing.
    const again = await store.completePassOrder("order_1", "pay_1");
    assert.equal(again.expiresAt, first.expiresAt);

    await order("order_2");
    const renewed = await store.completePassOrder("order_2", "pay_2");
    assert.ok(Math.abs(Date.parse(renewed.expiresAt) - (firstEnd + 365 * DAY)) < 60_000, "a year on top of the old end date");

    // After a Pass has ended, a new one starts from today.
    await users.updateOne({ _id: id }, { $set: { passExpiresAt: new Date(Date.now() - 10 * DAY) } });
    await order("order_3");
    const fresh = await store.completePassOrder("order_3", "pay_3");
    assert.ok(Math.abs(Date.parse(fresh.expiresAt) - (Date.now() + 365 * DAY)) < 60_000);

    // An earlier lifetime Pass still reads as it was.
    const old = await make({ passLifetime: true });
    assert.deepEqual(store.passStateOf(await users.findOne({ _id: old })).lifetime, true);
  } finally {
    await closeMongo();
  }
});

test("the trial counts 2 Pauses, each once, and an active Pass never uses it", { skip }, async () => {
  const { users, store, make, closeMongo } = await setup();
  try {
    const id = await make();
    let result = await store.countTrialPause(id, "pause-a");
    assert.equal(result.allowed, true);
    assert.equal(result.pass.trial.used, 1);
    // The same Pause again (resumed, or counted from two tabs) is still one.
    result = await store.countTrialPause(id, "pause-a");
    assert.equal(result.pass.trial.used, 1);
    result = await store.countTrialPause(id, "pause-b");
    assert.equal(result.allowed, true);
    assert.equal(result.pass.trial.used, 2);
    result = await store.countTrialPause(id, "pause-c");
    assert.equal(result.allowed, false, "a third Pause is refused");
    assert.deepEqual(result.pass.trial.pauseIds, ["pause-a", "pause-b"]);
    // A Pause the trial already counted still plays.
    assert.equal((await store.countTrialPause(id, "pause-b")).allowed, true);

    // Two devices racing for the last trial Pause: only one gets it.
    const racer = await make({ trialPauseIds: ["pause-a"] });
    const [x, y] = await Promise.all([store.countTrialPause(racer, "pause-x"), store.countTrialPause(racer, "pause-y")]);
    assert.equal([x.allowed, y.allowed].filter(Boolean).length, 1);
    assert.equal((await users.findOne({ _id: racer })).trialPauseIds.length, 2);

    const paid = await make({ passExpiresAt: new Date(Date.now() + 30 * DAY) });
    result = await store.countTrialPause(paid, "pause-z");
    assert.equal(result.allowed, true);
    assert.equal(result.pass.trial.used, 0, "the Pass doesn't touch the trial");
  } finally {
    await closeMongo();
  }
});

test("extending a Pass adds days from its end date, or from today", { skip }, async () => {
  const { users, store, make, closeMongo } = await setup();
  try {
    const active = await make({ passExpiresAt: new Date(Date.now() + 10 * DAY) });
    const end = await store.extendPass(active, 30);
    assert.ok(Math.abs(end.getTime() - (Date.now() + 40 * DAY)) < 60_000);
    const none = await make();
    const fresh = await store.extendPass(none, 30);
    assert.ok(Math.abs(fresh.getTime() - (Date.now() + 30 * DAY)) < 60_000);
    assert.equal(store.passStateOf(await users.findOne({ _id: none })).status, "active");
  } finally {
    await closeMongo();
  }
});

test("the ends soon email goes 7 days and 1 day before, once each", { skip }, async () => {
  const { users, make, closeMongo } = await setup();
  const sent = [];
  process.env.SMTP_HOST = "smtp.test";
  process.env.MAIL_FROM = "Inner Pause <no-reply@test>";
  const mailer = await import("../src/mailer.ts");
  const reminders = await import("../src/pass-reminders.ts");
  try {
    mailer.__setTransportForTests({ sendMail: async (message) => sent.push(message) });
    const now = new Date();
    const endsIn = (days) => new Date(now.getTime() + days * DAY);
    const sixDays = await make({ passExpiresAt: endsIn(6.5) });
    await make({ passExpiresAt: endsIn(20) });
    await make({ passLifetime: true, passExpiresAt: endsIn(3) });

    await reminders.sendPassReminders(now);
    assert.equal(sent.length, 1, "only the Pass within 7 days");
    assert.match(sent[0].subject, /ends on/);
    await reminders.sendPassReminders(now);
    assert.equal(sent.length, 1, "not twice");

    // A day before: the second one.
    await reminders.sendPassReminders(new Date(now.getTime() + 5.7 * DAY));
    assert.equal(sent.length, 2);
    assert.match(sent[1].subject, /ends tomorrow/);

    // Renewed: the next end date gets its own emails later.
    const user = await users.findOne({ _id: sixDays });
    assert.equal(user.passReminderDays, 1);
  } finally {
    mailer.__setTransportForTests(null);
    delete process.env.SMTP_HOST;
    delete process.env.MAIL_FROM;
    await closeMongo();
  }
});

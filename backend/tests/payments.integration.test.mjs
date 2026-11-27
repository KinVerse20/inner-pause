import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";

// The whole payment path through the API, against a stand-in for Razorpay's
// orders API (RAZORPAY_API_BASE): order, checkout's signed answer, verify,
// then the webhook for the same payment, which must not add a second year.
// Also the trial, bug report and admin routes with a real session.
//   TEST_MONGODB_URI=mongodb://127.0.0.1:27018/ip-pay-test npm test
// Its own database next to the one given: test files run at the same time.
const MONGO = process.env.TEST_MONGODB_URI && withDatabaseSuffix(process.env.TEST_MONGODB_URI, "payments");
function withDatabaseSuffix(uri, suffix) {
  const url = new URL(uri);
  url.pathname = `${url.pathname.replace(/^\//, "") || "test"}-${suffix}`;
  return url.toString();
}
const skip = MONGO ? false : "set TEST_MONGODB_URI to a throwaway database";
const DAY = 24 * 60 * 60 * 1000;
const sign = (secret, data) => createHmac("sha256", secret).update(data).digest("hex");

async function standInRazorpay() {
  let count = 0;
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      if (request.method === "POST" && request.url === "/v1/orders") {
        const order = JSON.parse(body);
        count += 1;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ id: `order_test${count}`, amount: order.amount, currency: order.currency }));
        return;
      }
      response.writeHead(404).end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

async function setup() {
  process.env.MONGODB_URI = MONGO;
  process.env.AUTH_SECRET = "test-secret-for-payments-0123456789";
  process.env.RAZORPAY_KEY_ID = "rzp_test_stand";
  process.env.RAZORPAY_KEY_SECRET = "stand-in-key-secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "stand-in-webhook-secret";
  process.env.ADMIN_EMAILS = "founder@example.com";
  const razorpay = await standInRazorpay();
  process.env.RAZORPAY_API_BASE = razorpay.base;
  const { getDb, usersCollection, closeMongo } = await import("../src/mongo.ts");
  const { createSessionToken } = await import("../src/auth/session.ts");
  const { createApp } = await import("../src/app.ts");
  const db = await getDb();
  for (const name of ["users", "pass_orders", "bug_reports", "pass_grants", "admin_changes"]) await db.collection(name).deleteMany({});
  const users = await usersCollection();
  const make = async (email) => {
    const { insertedId } = await users.insertOne({ email, passwordHash: "x", fullName: email.split("@")[0], phone: "", createdAt: new Date(), updatedAt: new Date() });
    const cookie = `ip_session=${createSessionToken({ id: insertedId.toString(), email, fullName: email.split("@")[0], phone: "" })}`;
    return { id: insertedId, cookie };
  };
  const done = async () => {
    razorpay.server.close();
    await closeMongo();
  };
  return { app: createApp(), db, users, make, done };
}

const json = (cookie, body) => ({ method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(body) });

test("buy the Pass: order, verify, then the webhook for the same payment", { skip }, async () => {
  const { app, users, make, done } = await setup();
  try {
    const asha = await make("asha@example.com");
    const offer = await (await app.request("/api/pass", { headers: { Cookie: asha.cookie } })).json();
    assert.equal(offer.available, true);
    assert.equal(offer.pass.status, "none");

    const orderResponse = await app.request("/api/pass/order", { method: "POST", headers: { Cookie: asha.cookie } });
    assert.equal(orderResponse.status, 200);
    const order = await orderResponse.json();
    assert.equal(order.amount, 100000, "₹1,000 in paise");
    assert.equal(order.keyId, "rzp_test_stand");

    // A forged signature is refused.
    const forged = await app.request("/api/pass/verify", json(asha.cookie, { orderId: order.orderId, paymentId: "pay_1", signature: "0".repeat(64) }));
    assert.equal(forged.status, 400);

    // Someone else can't claim Asha's order with a valid signature.
    const ravi = await make("ravi@example.com");
    const signature = sign("stand-in-key-secret", `${order.orderId}|pay_1`);
    const stolen = await app.request("/api/pass/verify", json(ravi.cookie, { orderId: order.orderId, paymentId: "pay_1", signature }));
    assert.equal(stolen.status, 404);

    const verified = await app.request("/api/pass/verify", json(asha.cookie, { orderId: order.orderId, paymentId: "pay_1", signature }));
    assert.equal(verified.status, 200);
    const { pass } = await verified.json();
    assert.equal(pass.status, "active");
    const end = Date.parse(pass.expiresAt);
    assert.ok(Math.abs(end - (Date.now() + 365 * DAY)) < 60_000);

    // Razorpay's webhook for the same payment: no second year.
    const event = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: order.orderId } } } });
    const badHook = await app.request("/api/pass/webhook", { method: "POST", headers: { "x-razorpay-signature": "nope" }, body: event });
    assert.equal(badHook.status, 400);
    const hook = await app.request("/api/pass/webhook", { method: "POST", headers: { "x-razorpay-signature": sign("stand-in-webhook-secret", event) }, body: event });
    assert.equal(hook.status, 200);
    assert.equal((await users.findOne({ _id: asha.id })).passExpiresAt.getTime(), end);

    // Paid by webhook alone (the app closed mid-payment): a second order renews.
    const second = await (await app.request("/api/pass/order", { method: "POST", headers: { Cookie: asha.cookie } })).json();
    const paid = JSON.stringify({ event: "order.paid", payload: { order: { entity: { id: second.orderId } }, payment: { entity: { id: "pay_2", order_id: second.orderId } } } });
    await app.request("/api/pass/webhook", { method: "POST", headers: { "x-razorpay-signature": sign("stand-in-webhook-secret", paid) }, body: paid });
    const renewed = (await users.findOne({ _id: asha.id })).passExpiresAt.getTime();
    assert.ok(Math.abs(renewed - (end + 365 * DAY)) < 1000, "a year on top");

    // An earlier lifetime Pass is never charged again.
    const old = await make("old@example.com");
    await users.updateOne({ _id: old.id }, { $set: { passLifetime: true } });
    assert.equal((await app.request("/api/pass/order", { method: "POST", headers: { Cookie: old.cookie } })).status, 409);
  } finally {
    await done();
  }
});

test("the trial through the API: 2 Pauses, then 402", { skip }, async () => {
  const { app, make, done } = await setup();
  try {
    const user = await make("trial@example.com");
    const count = (pauseId) => app.request("/api/pass/trial", json(user.cookie, { pauseId }));
    assert.equal((await count("p1")).status, 200);
    assert.equal((await count("p1")).status, 200);
    const second = await (await count("p2")).json();
    assert.equal(second.pass.trial.used, 2);
    const third = await count("p3");
    assert.equal(third.status, 402);
    assert.equal((await third.json()).allowed, false);
    const me = await (await app.request("/api/auth/me", { headers: { Cookie: user.cookie } })).json();
    assert.deepEqual(me.user.pass.trial.pauseIds, ["p1", "p2"]);
  } finally {
    await done();
  }
});

test("a bug report with a screenshot, and Valid gives a month once", { skip }, async () => {
  const { app, db, users, make, done } = await setup();
  try {
    const user = await make("reporter@example.com");
    const founder = await make("founder@example.com");
    const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5f0a1a30000000049454e44ae426082", "hex");

    // Not an image: refused.
    const fake = new FormData();
    fake.set("description", "The Pause stopped when I locked my phone");
    fake.set("screenshot", new File([Buffer.from("not an image at all")], "shot.png", { type: "image/png" }));
    assert.equal((await app.request("/api/bugs", { method: "POST", headers: { Cookie: user.cookie }, body: fake })).status, 415);

    const form = new FormData();
    form.set("description", "The Pause stopped when I locked my phone");
    form.set("page", "/pause/player · 390×844");
    form.set("screenshot", new File([png], "shot.png", { type: "image/png" }));
    const created = await app.request("/api/bugs", { method: "POST", headers: { Cookie: user.cookie }, body: form });
    assert.equal(created.status, 201);
    const { id } = await created.json();

    // A normal user can't see admin.
    assert.equal((await app.request("/api/admin/bugs", { headers: { Cookie: user.cookie } })).status, 404);

    const list = await (await app.request("/api/admin/bugs?status=new", { headers: { Cookie: founder.cookie } })).json();
    assert.equal(list.reports.length, 1);
    assert.equal(list.reports[0].hasScreenshot, true);
    const shot = await app.request(`/api/admin/bugs/${id}/screenshot`, { headers: { Cookie: founder.cookie } });
    assert.equal(shot.status, 200);
    assert.equal(shot.headers.get("content-type"), "image/png");

    // Two clicks on Valid at once: one month, not two.
    const valid = () => app.request(`/api/admin/bugs/${id}/status`, json(founder.cookie, { status: "valid" }));
    const results = await Promise.all([valid(), valid()]);
    const bodies = await Promise.all(results.map((response) => response.json()));
    assert.equal(bodies.filter((body) => body.rewarded).length, 1);
    const end = (await users.findOne({ _id: user.id })).passExpiresAt.getTime();
    assert.ok(Math.abs(end - (Date.now() + 30 * DAY)) < 60_000);
    // Back to New and Valid again: still no second month.
    await app.request(`/api/admin/bugs/${id}/status`, json(founder.cookie, { status: "new" }));
    const again = await (await valid()).json();
    assert.equal(again.rewarded, false);
    assert.equal((await users.findOne({ _id: user.id })).passExpiresAt.getTime(), end);
    assert.equal(await db.collection("pass_grants").countDocuments({ userId: user.id }), 1);

    // By hand, from the Users tab.
    const found = await (await app.request("/api/admin/users?q=reporter", { headers: { Cookie: founder.cookie } })).json();
    assert.equal(found.users[0].email, "reporter@example.com");
    const extended = await app.request(`/api/admin/users/${user.id}/extend`, json(founder.cookie, { days: 30 }));
    assert.equal(extended.status, 200);
    assert.ok(Math.abs((await users.findOne({ _id: user.id })).passExpiresAt.getTime() - (end + 30 * DAY)) < 1000);

    // Leave no test screenshot behind.
    const { fileStore } = await import("../src/file-store.ts");
    for (const report of await db.collection("bug_reports").find({ screenshotKey: { $exists: true } }).toArray()) await fileStore().remove(report.screenshotKey);
  } finally {
    await done();
  }
});

test("admin opens an account and changes it, and each change is logged", { skip }, async () => {
  const { app, db, users, make, done } = await setup();
  try {
    const user = await make("meera@example.com");
    const founder = await make("founder@example.com");
    const patch = (cookie, body) => app.request(`/api/admin/users/${user.id}`, { ...json(cookie, body), method: "PATCH" });

    // Not an admin: the route doesn't exist.
    assert.equal((await app.request(`/api/admin/users/${user.id}`, { headers: { Cookie: user.cookie } })).status, 404);
    assert.equal((await patch(user.cookie, { fullName: "Me" })).status, 404);

    // An admin has everything without buying, and is never charged.
    const founderPass = (await (await app.request("/api/auth/me", { headers: { Cookie: founder.cookie } })).json()).user.pass;
    assert.equal(founderPass.status, "active");
    assert.equal(founderPass.lifetime, true);
    assert.equal((await app.request("/api/pass/order", { method: "POST", headers: { Cookie: founder.cookie } })).status, 409);

    const opened = await (await app.request(`/api/admin/users/${user.id}`, { headers: { Cookie: founder.cookie } })).json();
    assert.equal(opened.user.email, "meera@example.com");

    // The newest accounts show with no search.
    const list = await (await app.request("/api/admin/users", { headers: { Cookie: founder.cookie } })).json();
    assert.equal(list.users.length, 2);

    // Details, an email someone else has, then a free one.
    assert.equal((await patch(founder.cookie, { email: "founder@example.com" })).status, 409);
    const details = await (await patch(founder.cookie, { fullName: "Meera S", phone: "98765 43210", email: "Meera.S@Example.com" })).json();
    assert.deepEqual(details.changed.sort(), ["email", "fullName", "phone"]);
    assert.equal(details.user.email, "meera.s@example.com");

    // The Pass: an end date, then for life, then off again.
    const end = "2027-01-31T23:59:59+05:30";
    const dated = await (await patch(founder.cookie, { passExpiresAt: end })).json();
    assert.equal(dated.user.passExpiresAt, new Date(end).toISOString());
    assert.equal((await (await patch(founder.cookie, { passLifetime: true })).json()).user.pass.lifetime, true);
    const removed = await (await patch(founder.cookie, { passLifetime: false, passExpiresAt: null })).json();
    assert.equal(removed.user.pass.status, "none");

    // The trial starts again.
    await users.updateOne({ _id: user.id }, { $set: { trialPauseIds: ["a", "b"] } });
    assert.equal((await (await patch(founder.cookie, { resetTrial: true })).json()).user.pass.trial.used, 0);

    // A new password: their old session stops working, the new password signs in.
    assert.equal((await patch(founder.cookie, { newPassword: "abc" })).status, 400);
    assert.equal((await patch(founder.cookie, { newPassword: "Fresh-pass-1" })).status, 200);
    assert.equal((await (await app.request("/api/auth/me", { headers: { Cookie: user.cookie } })).json()).user, null);
    const login = await app.request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "meera.s@example.com", password: "Fresh-pass-1" }) });
    assert.equal(login.status, 200);

    // Every change logged with who made it, and never the password itself.
    const log = await db.collection("admin_changes").find({ userId: user.id }).toArray();
    assert.ok(log.length >= 6);
    assert.ok(log.every((entry) => entry.by === "founder@example.com"));
    assert.ok(!JSON.stringify(log).includes("Fresh-pass-1"));
  } finally {
    await done();
  }
});

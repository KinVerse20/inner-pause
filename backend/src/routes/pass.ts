import { PASS_DAYS, PASS_PRICE_INR } from "@inner-pause/shared";
import { Hono } from "hono";

import { getVerifiedSession } from "../auth/session";
import { invalidBody, readJsonObject, stringField } from "../http";
import {
  completePassOrder,
  createPassOrder,
  isValidPaymentSignature,
  isValidWebhookSignature,
  passStateOf,
  razorpayConfigured,
  razorpayKeyId,
} from "../pass-store";

export const passRoutes = new Hono();

// The offer, whether it can be bought right now, and (signed in) your Pass.
passRoutes.get("/", async (c) => {
  const verified = await getVerifiedSession(c);
  return c.json({
    priceInr: PASS_PRICE_INR,
    durationDays: PASS_DAYS,
    available: razorpayConfigured(),
    pass: verified ? passStateOf(verified.record) : null,
  });
});

passRoutes.post("/order", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Sign in to get the Pass, so it stays with your account." }, 401);
  if (!razorpayConfigured()) return c.json({ error: "Payments aren't set up yet. Please try again later." }, 503);
  try {
    const order = await createPassOrder(verified.record._id.toString());
    return c.json({
      ...order,
      keyId: razorpayKeyId(),
      prefill: { name: verified.record.fullName, email: verified.record.email, contact: verified.record.phone },
    });
  } catch (error) {
    console.error("[pass] order failed:", error instanceof Error ? error.message : error);
    return c.json({ error: "Couldn't start the payment. Please try again." }, 502);
  }
});

// Called by the app after Razorpay Checkout succeeds.
passRoutes.post("/verify", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const orderId = stringField(body.orderId, 100);
  const paymentId = stringField(body.paymentId, 100);
  const signature = stringField(body.signature, 200);
  if (!orderId || !paymentId || !signature || !isValidPaymentSignature(orderId, paymentId, signature)) {
    return c.json({ error: "This payment couldn't be confirmed. If you were charged, contact us and we'll sort it out." }, 400);
  }
  const pass = await completePassOrder(orderId, paymentId, verified.record._id.toString());
  if (!pass) return c.json({ error: "This payment doesn't belong to your account." }, 404);
  return c.json({ pass });
});

// Razorpay's server-to-server notice (Dashboard → Webhooks: payment.captured
// and order.paid), so a Pass is granted even if the app closed mid-payment.
passRoutes.post("/webhook", async (c) => {
  const raw = await c.req.text();
  if (!isValidWebhookSignature(raw, c.req.header("x-razorpay-signature") ?? "")) {
    return c.json({ error: "Invalid signature." }, 400);
  }
  try {
    const event = JSON.parse(raw) as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string } }; order?: { entity?: { id?: string } } };
    };
    const payment = event.payload?.payment?.entity;
    const orderId = event.payload?.order?.entity?.id ?? payment?.order_id;
    if ((event.event === "payment.captured" || event.event === "order.paid") && orderId && payment?.id) {
      await completePassOrder(orderId, payment.id);
    }
  } catch (error) {
    console.error("[pass] webhook failed:", error instanceof Error ? error.message : error);
    return c.json({ error: "Couldn't process this event." }, 500);
  }
  return c.json({ ok: true });
});

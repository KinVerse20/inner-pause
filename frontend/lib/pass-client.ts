"use client";

import type { PassState } from "@inner-pause/shared";

import { apiFetch } from "@/lib/api";
import { setServerPass } from "@/lib/entitlements";

// Buying the Inner Pause Pass: the server creates a Razorpay order, Razorpay
// Checkout takes the payment (UPI, cards, netbanking, wallets), and the
// server confirms it before the Pass is granted (backend/src/routes/pass.ts).

export interface PassOffer {
  priceInr: number;
  durationDays: number;
  /** False until Razorpay is configured on the server. */
  available: boolean;
  /** The signed-in account's Pass; null when signed out. */
  pass: PassState | null;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

async function readError(response: Response, fallback: string) {
  try {
    return ((await response.json()) as { error?: string }).error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getPassOffer(): Promise<PassOffer> {
  const response = await apiFetch("/api/pass", { cache: "no-store" });
  if (!response.ok) throw new Error(await readError(response, "Couldn't load the Pass. Check your connection."));
  return (await response.json()) as PassOffer;
}

function loadCheckout(): Promise<RazorpayConstructor> {
  const existing = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => {
      const loaded = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
      if (loaded) resolve(loaded);
      else reject(new Error("The payment window didn't load. Please try again."));
    };
    script.onerror = () => reject(new Error("The payment window didn't load. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

export class PaymentCancelledError extends Error {}

/**
 * Takes the user through payment. Resolves with their updated Pass once the
 * server has confirmed it; rejects with PaymentCancelledError if they close
 * the payment window, or an Error with a message to show.
 */
export async function buyPass(durationDays: number): Promise<PassState> {
  const orderResponse = await apiFetch("/api/pass/order", { method: "POST" });
  if (!orderResponse.ok) throw new Error(await readError(orderResponse, "Couldn't start the payment. Please try again."));
  const order = (await orderResponse.json()) as {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    prefill: { name?: string; email?: string; contact?: string };
  };
  const Razorpay = await loadCheckout();

  return new Promise<PassState>((resolve, reject) => {
    let lastFailure = "";
    const checkout = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Inner Pause",
      description: `Inner Pause Pass · ${durationDays} days`,
      order_id: order.orderId,
      prefill: order.prefill,
      theme: { color: "#1d1b4c" },
      handler: (response: RazorpayResponse) => {
        void (async () => {
          const verifyResponse = await apiFetch("/api/pass/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });
          if (!verifyResponse.ok) {
            reject(new Error(await readError(verifyResponse, "Your payment went through but couldn't be confirmed yet. Contact us and we'll sort it out.")));
            return;
          }
          const { pass } = (await verifyResponse.json()) as { pass: PassState };
          setServerPass(pass);
          resolve(pass);
        })().catch(() => reject(new Error("Your payment went through but couldn't be confirmed yet. Contact us and we'll sort it out.")));
      },
      modal: {
        // Closed without paying (Razorpay keeps the window open to retry a failed payment).
        ondismiss: () => reject(lastFailure ? new Error(lastFailure) : new PaymentCancelledError("Payment cancelled.")),
      },
    });
    checkout.on("payment.failed", (response) => {
      lastFailure = response.error?.description ? `Payment failed: ${response.error.description}` : "Payment failed. No money was taken.";
    });
    checkout.open();
  });
}

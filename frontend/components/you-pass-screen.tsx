"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PASS_DAYS, PASS_PRICE_INR } from "@inner-pause/shared";

import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import { getAccount, subscribeAccount, type LocalAccount } from "@/lib/account-store";
import {
  activateDevPass,
  clearPass,
  expireDevPassForTesting,
  getPassExpiresAt,
  getPassState,
  subscribeEntitlements,
  type PassState,
} from "@/lib/entitlements";
import { PaymentCancelledError, buyPass, getPassOffer, type PassOffer } from "@/lib/pass-client";

const PASS_BENEFITS = [
  "Unlimited Practice: every course and every session",
  "Longitudinal pattern analysis across your full history",
  "Deeper cross-entry connections",
  "Growth comparisons over time, then and now",
  "Richer, more personalised Journey interpretation",
];

const FREE_INCLUDES = [
  "Every Pause, Tell and Moments",
  "Two Practice sessions to try it",
  "The complete Journal, always",
  "The complete Highlights history, always",
  "Basic recent Patterns",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

// You -> Inner Pause Pass (docs/PRODUCT_FLOW.md §36): one product, one price,
// 60 days, no recurring subscription. Bought with Razorpay and held on the
// account (lib/pass-client.ts). Expiry never touches history: Journal,
// Highlights, Patterns, Growth and Practice history all stay exactly as they
// are; only new paid-depth use is gated.
export function YouPassScreen() {
  const [state, setState] = useState<PassState>("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [offer, setOffer] = useState<PassOffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const refresh = () => {
      setState(getPassState());
      setExpiresAt(getPassExpiresAt());
      setAccount(getAccount());
    };
    refresh();
    const unsubscribeEntitlements = subscribeEntitlements(refresh);
    const unsubscribeAccount = subscribeAccount(refresh);
    getPassOffer()
      .then(setOffer)
      .catch(() => setOffer(null));
    return () => {
      unsubscribeEntitlements();
      unsubscribeAccount();
    };
  }, []);

  const purchase = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const pass = await buyPass(offer?.durationDays ?? PASS_DAYS);
      setMessage({ tone: "success", text: pass.expiresAt ? `Thank you. Your Pass is active until ${formatDate(pass.expiresAt)}.` : "Thank you. Your Pass is active." });
    } catch (error) {
      if (!(error instanceof PaymentCancelledError)) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
      }
    } finally {
      setBusy(false);
    }
  };

  const price = offer?.priceInr ?? PASS_PRICE_INR;
  const days = offer?.durationDays ?? PASS_DAYS;
  const buyLabel = state === "active" ? `Add ${days} more days · ₹${price}` : state === "expired" ? `Renew · ₹${price}` : `Get the Pass · ₹${price}`;

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Inner Pause Pass" />

        <section className="space-y-2 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
          {state === "active" ? (
            <>
              <p className="text-[0.98rem] font-semibold" style={{ color: "var(--ds-success)" }}>
                Pass active
              </p>
              {expiresAt ? (
                <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                  Runs through {formatDate(expiresAt)}.
                </p>
              ) : null}
            </>
          ) : state === "expired" ? (
            <>
              <p className="text-[0.98rem] font-semibold" style={{ color: "var(--ds-warning)" }}>
                Pass expired
              </p>
              <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                Nothing was deleted or hidden. Your Journal, Highlights, Practice history and saved Pauses are all still here. Only
                the Pass features below are paused until you renew.
              </p>
            </>
          ) : (
            <>
              <p className="text-[0.98rem] font-semibold">Free</p>
              <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                Pauses, Tell, Moments and your Journal are free, always. The Pass adds unlimited Practice and deeper Journey insight.
              </p>
            </>
          )}
        </section>

        <section className="space-y-3 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
          <p className="text-[0.95rem] font-semibold">
            ₹{price} for {days} days
          </p>
          <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
            One payment, no subscription. It never renews by itself. Pay with UPI, card, netbanking or wallet.
          </p>
          {account ? (
            <button
              type="button"
              onClick={() => void purchase()}
              disabled={busy || offer?.available === false}
              className="ds-filled ds-tap w-full disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busy ? "Opening payment…" : offer?.available === false ? "Payments open soon" : buyLabel}
            </button>
          ) : (
            <>
              <Link href="/auth?redirectTo=/profile/pass" className="ds-filled ds-tap flex w-full justify-center">
                Sign in to get the Pass
              </Link>
              <p className="text-[0.76rem]" style={{ color: "var(--ds-text-muted)" }}>
                The Pass is kept on your account, so it works on any device you sign in on.
              </p>
            </>
          )}
          {message ? (
            <p role={message.tone === "error" ? "alert" : "status"} className="text-[0.82rem]" style={{ color: message.tone === "error" ? "var(--ds-error)" : "var(--ds-success)" }}>
              {message.text}
            </p>
          ) : null}
          <p className="text-[0.75rem]" style={{ color: "var(--ds-text-muted)" }}>
            By buying, you agree to the{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/refund-policy" className="underline underline-offset-2">
              Refund policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-[0.82rem] font-semibold">Free, always</h2>
          <ul className="space-y-1.5 rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
            {FREE_INCLUDES.map((item) => (
              <li key={item} className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="px-1 text-[0.82rem] font-semibold">Pass unlocks</h2>
          <ul className="space-y-1.5 rounded-[var(--ds-radius-md)] px-4 py-3.5" style={{ background: "var(--ds-surface)" }}>
            {PASS_BENEFITS.map((item) => (
              <li key={item} className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {process.env.NODE_ENV === "development" ? (
          <section
            aria-label="Dev: Pass testing"
            className="space-y-2 rounded-[var(--ds-radius-sm)] border border-dashed px-3 py-3 text-xs"
            style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-muted)" }}
          >
            <p className="font-semibold">DEV — Pass testing (works in development only)</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => activateDevPass()}
                className="ds-tap min-h-11 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Activate Pass
              </button>
              <button
                type="button"
                onClick={() => expireDevPassForTesting()}
                className="ds-tap min-h-11 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Force expired
              </button>
              <button
                type="button"
                onClick={() => clearPass()}
                className="ds-tap min-h-11 rounded-full border px-3 font-medium"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Reset to free
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </PauseShell>
  );
}

"use client";

import { useEffect, useState } from "react";

import { YouScreenHeader } from "@/components/settings-row";
import { PauseShell } from "@/components/pause-shell";
import { getAccount, signInDev, signOut, subscribeAccount, type LocalAccount } from "@/lib/account-store";

// You -> Account (docs/PRODUCT_FLOW.md §27: "Profile · Login · Inner Pause
// Pass"). No mandatory signup before first value — everything above this
// screen already works with zero account. Real Supabase auth
// (components/auth-screen.tsx) is dormant locally and out of scope for
// this slice; "Sign in" here is a local/dev-safe substitute that
// represents the correct future signed-in state without inventing a
// different product flow (this slice's brief §2/§11).
export function YouAccountScreen() {
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const refresh = () => setAccount(getAccount());
    refresh();
    return subscribeAccount(refresh);
  }, []);

  const handleSignIn = () => {
    signInDev(name || "You", email || undefined);
    setName("");
    setEmail("");
  };

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Account" />

        {account ? (
          <section className="space-y-4 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <div>
              <p className="text-[0.98rem] font-semibold">{account.displayName}</p>
              {account.email ? (
                <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
                  {account.email}
                </p>
              ) : null}
              <p className="mt-1 text-[0.72rem]" style={{ color: "var(--ds-text-muted)" }}>
                Signed in {new Date(account.signedInAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="ds-tap min-h-11 rounded-full border px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ borderColor: "var(--ds-border)" }}
            >
              Sign out
            </button>
          </section>
        ) : (
          <section className="space-y-3.5 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <p className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
              You&apos;re not signed in. Everything you&apos;ve done — Pauses, Journal, Practice — already lives on this
              device, and keeps working without an account.
            </p>
            <div className="space-y-2.5">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="min-h-11 w-full rounded-[var(--ds-radius-sm)] border px-3.5 text-[0.9rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ borderColor: "var(--ds-border)", background: "var(--ds-bg)" }}
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email (optional)"
                type="email"
                className="min-h-11 w-full rounded-[var(--ds-radius-sm)] border px-3.5 text-[0.9rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ borderColor: "var(--ds-border)", background: "var(--ds-bg)" }}
              />
            </div>
            <button
              type="button"
              onClick={handleSignIn}
              className="ds-tap min-h-11 rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
            >
              Sign in
            </button>
            <p className="text-[0.72rem]" style={{ color: "var(--ds-text-muted)" }}>
              Local sign-in for now — this device only.
            </p>
          </section>
        )}
      </div>
    </PauseShell>
  );
}

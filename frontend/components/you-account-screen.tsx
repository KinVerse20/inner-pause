"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { YouScreenHeader } from "@/components/settings-row";
import { PauseShell } from "@/components/pause-shell";
import { clearAccount, getAccount, subscribeAccount, type LocalAccount } from "@/lib/account-store";
import { getCurrentUser, logout } from "@/lib/auth-client";
import { clearMvpAuthenticatedUser } from "@/lib/mvp-storage";

export function YouAccountScreen() {
  const [account, setAccount] = useState<LocalAccount | null>(null);

  useEffect(() => {
    const refresh = () => setAccount(getAccount());
    refresh();
    getCurrentUser()
      .then((user) => {
        if (!user) setAccount(null);
      })
      // Server unreachable: keep showing the local account.
      .catch(() => {});
    return subscribeAccount(refresh);
  }, []);

  const handleSignOut = async () => {
    await logout();
    clearMvpAuthenticatedUser();
    clearAccount();
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
              <p className="mt-1 text-[0.75rem]" style={{ color: "var(--ds-text-muted)" }}>
                Signed in {new Date(account.signedInAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="ds-tap min-h-11 rounded-full border px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ borderColor: "var(--ds-border)" }}
            >
              Sign out
            </button>
          </section>
        ) : (
          <section className="space-y-3.5 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <p className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
              You&apos;re not signed in. Pauses, Journal and Practice still work on this device. Sign in to keep your
              account in MongoDB.
            </p>
            <Link
              href="/auth"
              className="ds-tap inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
            >
              Sign in
            </Link>
          </section>
        )}
      </div>
    </PauseShell>
  );
}

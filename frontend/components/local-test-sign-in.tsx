"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { applyServerAccount } from "@/lib/account-store";
import { testSignIn } from "@/lib/auth-client";
import { localTestAllowed } from "@/lib/local-test";
import { setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";

const noSubscribe = () => () => {};

// Dev-only one-tap sign-in (lib/local-test.ts). Laid out like Entry, so
// testing starts from the same calm screen a listener sees.
export function LocalTestSignIn() {
  const router = useRouter();
  // Hostname is only known in the browser; on the server render the button waits.
  const allowed = useSyncExternalStore(
    noSubscribe,
    () => localTestAllowed(process.env.NEXT_PUBLIC_LOCAL_TEST_AUTH, window.location.hostname, process.env.NEXT_PUBLIC_API_URL ?? ""),
    () => false,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const enter = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await testSignIn();
      setMvpAuthenticatedUser(user.id);
      upsertProfile({ fullName: user.fullName, email: user.email, onboardingCompleted: true });
      applyServerAccount(user);
      router.replace("/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't open the test account.");
      setBusy(false);
    }
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{
        background: "radial-gradient(90% 55% at 50% 38%, var(--ds-accent-soft) 0%, var(--ds-bg) 70%)",
        color: "var(--ds-text)",
        fontFamily: "var(--ds-font-sans)",
      }}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col items-center px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))] text-center">
        <div className="ds-settle grid flex-1 content-center justify-items-center">
          <HarmonyFormVisual playing={false} className="ds-only-light w-[min(44vw,11rem)]" />
          <HarmonyFormVisual playing={false} dark className="ds-only-dark w-[min(44vw,11rem)]" />
          <p className="ds-label mt-8 uppercase tracking-[0.2em]" style={{ color: "var(--ds-text-muted)" }}>
            Inner Pause · Local preview
          </p>
          <h1 className="mt-3 text-[1.35rem] font-semibold leading-snug tracking-[-0.01em]">
            A test account,
            <br />
            one tap away.
          </h1>
          <p className="mt-3 max-w-[18rem] text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            You sign in as the local test listener. No email or password, and it only works on this machine.
          </p>
        </div>

        <div className="ds-settle w-full space-y-3" style={{ animationDelay: "0.12s" }}>
          {error ? (
            <p role="alert" className="text-[0.9rem] leading-5" style={{ color: "var(--ds-error)" }}>
              {error}
            </p>
          ) : null}
          <button type="button" onClick={() => void enter()} disabled={!allowed || busy} className="ds-filled w-full">
            {busy ? "Opening" : "Enter as test listener"}
          </button>
          {!allowed ? (
            <p className="ds-caption" style={{ color: "var(--ds-text-muted)" }}>
              Open this on localhost to use it.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

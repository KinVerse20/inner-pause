"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { IconChevronRight } from "@/components/pause-icons";
import { Reveal } from "@/components/reveal";
import { resetPassword } from "@/lib/auth-client";

// Choosing a new password, from the emailed link. Same calm frame as
// signing in (auth-screen.tsx): the soft wash, the breathing mark.
export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // Shown straight away for a link without a token, derived rather than
  // set from an effect.
  const shownError = error || (token ? "" : "This reset link is missing or incomplete. Ask for a new one from Sign in.");

  const submit = async () => {
    setError("");
    setStatus("");
    if (!token) {
      setError("This reset link is missing or incomplete. Ask for a new one from Sign in.");
      return;
    }
    if (password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setStatus("Your password is updated. Taking you to sign in.");
      setTimeout(() => router.replace("/auth?mode=login"), 1200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your password couldn't be updated. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{
        background: "radial-gradient(90% 45% at 50% 18%, var(--ds-accent-soft) 0%, var(--ds-bg) 70%)",
        color: "var(--ds-text)",
        fontFamily: "var(--ds-font-sans)",
      }}
    >
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <header>
          <Link href="/auth?mode=login" aria-label="Back to sign in" className="ds-icon-btn ds-tap" style={{ color: "var(--ds-text)" }}>
            <IconChevronRight className="h-5 w-5" style={{ transform: "scaleX(-1)" }} />
          </Link>
        </header>

        <Reveal className="mt-4 grid justify-items-center text-center">
          <HarmonyFormVisual playing className="ds-only-light w-24" />
          <HarmonyFormVisual playing dark className="ds-only-dark w-24" />
          <h1 className="ds-display mt-5 text-[2rem]">A new password</h1>
          <p className="mt-2 text-[0.95rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Choose one for your Inner Pause account.
          </p>
        </Reveal>

        <Reveal className="mt-8" delay={0.1}>
          <form
            className="ds-card space-y-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="block">
              <span className="text-sm font-medium">New password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="ds-field mt-1.5" autoComplete="new-password" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Type it again</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="ds-field mt-1.5" autoComplete="new-password" />
            </label>
            {status ? (
              <p role="status" className="rounded-[var(--ds-radius-md)] px-3 py-2 text-sm" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-success)" }}>
                {status}
              </p>
            ) : null}
            {shownError ? (
              <p role="alert" className="rounded-[var(--ds-radius-md)] px-3 py-2 text-sm" style={{ background: "color-mix(in srgb, var(--ds-error) 12%, var(--ds-surface))", color: "var(--ds-error)" }}>
                {shownError}
              </p>
            ) : null}
            <button type="submit" disabled={loading} className="ds-filled ds-tap w-full disabled:opacity-70">
              {loading ? "Updating" : "Save new password"}
            </button>
          </form>
        </Reveal>
      </div>
    </div>
  );
}

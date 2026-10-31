"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { LandscapeScene } from "@/components/landscape-scene";
import { IconApple, IconChevronRight, IconGoogle, IconMail } from "@/components/pause-icons";
import { Reveal } from "@/components/reveal";
import { applyServerAccount } from "@/lib/account-store";
import { login, requestPasswordReset, signup } from "@/lib/auth-client";
import { setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Same-site paths only: "//host" and "/\host" would leave the app (an
  // open redirect after sign-in).
  const requested = searchParams.get("redirectTo") ?? "";
  const redirectTo = requested.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/\\") ? requested : "/";
  const routeMessage = searchParams.get("message");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [showEmail, setShowEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(routeMessage ?? "");
  const [error, setError] = useState("");

  const rememberUser = (user: { id: string; email: string; fullName: string }) => {
    setMvpAuthenticatedUser(user.id);
    upsertProfile({ fullName: user.fullName, email: user.email });
    applyServerAccount(user);
  };

  const submit = async () => {
    setError("");
    setStatus("");

    if (!email) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setStatus("If an account exists for that email, we've sent it a link to choose a new password. The link works for 1 hour.");
        return;
      }

      if (!password) {
        setError("Password is required.");
        return;
      }

      if (mode === "signup") {
        const user = await signup({ email, password, fullName: name });
        rememberUser(user);
        router.replace(redirectTo ?? "/");
        router.refresh();
        return;
      }

      const user = await login({ email, password });
      rememberUser(user);
      router.replace(redirectTo ?? "/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showProviderNotice = (provider: string) => {
    window.alert(`${provider} sign-in is not connected yet. Use email and password.`);
  };

  const headline = mode === "forgot" ? "Reset password" : mode === "login" ? "Welcome back" : "Create your account";
  const subhead =
    mode === "forgot"
      ? "We’ll send a reset link if that email is on file."
      : "Start your journey with Inner Pause.";

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]">
        <LandscapeScene variant="dawn" className="h-full w-full opacity-70" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to Home"
            className="ds-icon-btn ds-tap focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            style={{ color: "var(--ds-text)" }}
          >
            <IconChevronRight className="h-5 w-5" style={{ transform: "scaleX(-1)" }} />
          </Link>
        </header>

        <Reveal className="mt-8">
          <h1 className="ds-display text-[2rem] sm:text-[2.25rem]">{headline}</h1>
          <p className="mt-2 text-[0.95rem]" style={{ color: "var(--ds-text-secondary)" }}>
            {subhead}
          </p>
        </Reveal>

        <Reveal className="mt-8 space-y-3" delay={0.1}>
          <button type="button" onClick={() => showProviderNotice("Apple")} className="ds-outlined ds-tap w-full">
            <IconApple className="h-5 w-5" />
            Continue with Apple
          </button>
          <button type="button" onClick={() => showProviderNotice("Google")} className="ds-outlined ds-tap w-full">
            <IconGoogle className="h-5 w-5" />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => {
              setShowEmail(true);
              setMode(mode === "forgot" ? "signup" : mode);
            }}
            className="ds-outlined ds-tap w-full"
          >
            <IconMail className="h-5 w-5" />
            Continue with Email
          </button>
        </Reveal>

        {showEmail || mode === "forgot" ? (
          <form
            className="ds-card mt-6 space-y-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {mode === "signup" ? (
              <label className="block">
                <span className="text-sm font-medium">Full name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="ds-field mt-1.5" autoComplete="name" />
              </label>
            ) : null}
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="ds-field mt-1.5"
                autoComplete="email"
              />
            </label>
            {mode !== "forgot" ? (
              <label className="block">
                <span className="text-sm font-medium">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="ds-field mt-1.5"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </label>
            ) : null}
            {status ? (
              <p className="rounded-[var(--ds-radius-md)] px-3 py-2 text-sm" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-success)" }}>
                {status}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-[var(--ds-radius-md)] px-3 py-2 text-sm" style={{ background: "color-mix(in srgb, var(--ds-error) 12%, white)", color: "var(--ds-error)" }}>
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={loading} className="ds-filled ds-tap w-full disabled:opacity-70">
              {loading ? "Please wait…" : mode === "forgot" ? "Send reset link" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        ) : null}

        <p className="mt-6 text-center text-[0.75rem] leading-5" style={{ color: "var(--ds-text-muted)" }}>
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>

        <div className="relative z-10 mt-auto space-y-2 bg-gradient-to-t from-[var(--ds-bg)] via-[var(--ds-bg)] to-transparent pt-10 pb-2 text-center text-sm" style={{ color: "var(--ds-text-secondary)" }}>
          {mode === "login" ? (
            <button type="button" onClick={() => setMode("signup")} className="ds-tap inline-flex min-h-11 items-center font-medium">
              New here? <span style={{ color: "var(--ds-accent)" }}>Create an account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setShowEmail(true);
              }}
              className="ds-tap inline-flex min-h-11 items-center font-medium"
            >
              Already have an account? <span style={{ color: "var(--ds-accent)" }}>Sign in</span>
            </button>
          )}
          <div className="mt-2">
            <button type="button" onClick={() => setMode("forgot")} className="ds-tap inline-flex min-h-11 items-center px-2 text-xs" style={{ color: "var(--ds-text-muted)" }}>
              Forgot password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

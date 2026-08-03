"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BrandLogo, GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { useAuth } from "@/lib/auth/auth-provider";

export function AuthScreen() {
  const router = useRouter();
  const auth = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo")?.startsWith("/") ? searchParams.get("redirectTo") : "/";
  const routeMessage = searchParams.get("message");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(routeMessage ?? "");
  const [error, setError] = useState("");

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
        await auth.forgotPassword(email);
        setStatus("Password reset code sent. Check your inbox.");
        return;
      }

      if (!password) {
        setError("Password is required.");
        return;
      }

      if (mode === "signup") {
        await auth.signUp({ email, password, fullName: name });
        setStatus("Check your email for the verification code.");
        setMode("login");
        return;
      }

      await auth.signIn({ email, password, fullName: name });

      router.replace(redirectTo ?? "/");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError("");
    setStatus("");
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    try {
      await auth.resendVerification(email);
      setStatus("Verification email resent. Check your inbox.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const showProviderNotice = (provider: string) => {
    window.alert(`${provider} sign-in is not connected yet. Use email and password.`);
  };

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-xl space-y-5">
        <BrandLogo />
        <SectionTitle
          title={mode === "forgot" ? "Reset Password" : "Welcome"}
          copy="Sign in to keep your Inner Pause reflections and reset sessions connected to your account."
        />
        <GlassCard className="space-y-4 p-5">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-sm text-[#4b3f86]">Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="soft-input mt-2 w-full rounded-2xl p-3" />
            </label>
          ) : null}
          <label className="block">
            <span className="text-sm text-[#4b3f86]">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="soft-input mt-2 w-full rounded-2xl p-3" />
          </label>
          {mode !== "forgot" ? (
            <label className="block">
              <span className="text-sm text-[#4b3f86]">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="soft-input mt-2 w-full rounded-2xl p-3" />
            </label>
          ) : null}
          {mode === "login" ? (
            <label className="block">
              <span className="text-sm text-[#4b3f86]">Verification code</span>
              <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} className="soft-input mt-2 w-full rounded-2xl p-3" />
              <button
                type="button"
                disabled={loading || !email || !verificationCode}
                onClick={() =>
                  auth
                    .confirmSignUp({ email, code: verificationCode })
                    .then(() => setStatus("Account verified. You can now log in."))
                    .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not verify account."))
                }
                className="mt-2 min-h-10 w-full rounded-full border border-purple-200 bg-white text-sm text-[#6d28d9] disabled:opacity-45"
              >
                Verify account
              </button>
            </label>
          ) : null}
          {status ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{status}</p> : null}
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <GoldButton className="w-full" disabled={loading} onClick={submit}>
            {loading ? "Please wait..." : mode === "forgot" ? "Send Reset Link" : mode === "login" ? "Log In" : "Create Account"}
          </GoldButton>
          <button type="button" disabled={loading} onClick={resendVerification} className="min-h-11 w-full rounded-full border border-purple-200 bg-white text-sm text-[#6d28d9] disabled:opacity-45">
            Resend verification email
          </button>
          <div className="grid gap-2 text-sm text-[#6d5ea8]">
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Create an account" : "I already have an account"}
            </button>
            <button type="button" onClick={() => setMode("forgot")}>Forgot password?</button>
            <button type="button" onClick={() => showProviderNotice("Google")} className="opacity-70">Continue with Google</button>
            <button type="button" onClick={() => showProviderNotice("Apple")} className="opacity-50">Continue with Apple</button>
          </div>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

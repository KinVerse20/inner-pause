"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BrandLogo, GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { authConfirmRedirectTo, hasSupabaseBrowserConfig } from "@/lib/supabase/config";

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo")?.startsWith("/") ? searchParams.get("redirectTo") : "/";
  const routeMessage = searchParams.get("message");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(routeMessage ?? "");
  const [error, setError] = useState("");

  const supabase = hasSupabaseBrowserConfig ? createSupabaseBrowserClient() : null;

  const submit = async () => {
    setError("");
    setStatus("");

    if (!supabase) {
      setError("Supabase authentication is not configured in this environment.");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (resetError) throw resetError;
        setStatus("Password reset email sent. Check your inbox.");
        return;
      }

      if (!password) {
        setError("Password is required.");
        return;
      }

      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authConfirmRedirectTo,
            data: {
              full_name: name,
              name,
            },
          },
        });
        if (signupError) throw signupError;

        if (data.user) {
          await fetch("/api/profile/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.user.id, email, fullName: name }),
          }).catch(() => undefined);
        }

        await supabase.auth.signOut();
        setStatus("Check your email to verify your account.");
        setMode("login");
        return;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        const message = loginError.message.toLowerCase().includes("confirm")
          ? "Please verify your email before logging in."
          : loginError.message;
        setError(message);
        return;
      }

      const user = data.user;
      if (!user?.email_confirmed_at && !user?.confirmed_at) {
        await supabase.auth.signOut();
        setError("Please verify your email before logging in.");
        return;
      }

      setMvpAuthenticatedUser(user.id);
      upsertProfile({
        fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? name,
        email: user.email ?? email,
        onboardingCompleted: true,
      });

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? name,
          email: user.email ?? email,
        }),
      }).catch(() => undefined);

      router.replace(redirectTo ?? "/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError("");
    setStatus("");
    if (!supabase) {
      setError("Supabase authentication is not configured in this environment.");
      return;
    }
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: authConfirmRedirectTo },
      });
      if (resendError) throw resendError;
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
          copy="Sign in to keep your InnerPause reflections and healing sessions connected to your account."
        />
        <GlassCard className="space-y-4 p-5">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-sm text-stone-400">Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
            </label>
          ) : null}
          <label className="block">
            <span className="text-sm text-stone-400">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
          </label>
          {mode !== "forgot" ? (
            <label className="block">
              <span className="text-sm text-stone-400">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
            </label>
          ) : null}
          {status ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</p> : null}
          {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          <GoldButton className="w-full" disabled={loading} onClick={submit}>
            {loading ? "Please wait..." : mode === "forgot" ? "Send Reset Link" : mode === "login" ? "Log In" : "Create Account"}
          </GoldButton>
          <button type="button" disabled={loading} onClick={resendVerification} className="min-h-11 w-full rounded-full border border-[var(--gold-border-soft)] text-sm text-[var(--gold-light)] disabled:opacity-45">
            Resend verification email
          </button>
          <div className="grid gap-2 text-sm text-stone-400">
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


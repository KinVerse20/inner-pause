"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BrandLogo, GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { useAuth } from "@/lib/auth/auth-provider";

export function ResetPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setStatus("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await auth.confirmForgotPassword({ email, code, password });
      setStatus("Password updated. You can now log in.");
      setTimeout(() => router.replace("/auth"), 900);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-xl space-y-5">
        <BrandLogo />
        <SectionTitle title="Choose a new password" copy="Enter a new password for your Inner Pause account." />
        <GlassCard className="space-y-4 p-5">
          <label className="block">
            <span className="text-sm text-stone-400">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
          </label>
          <label className="block">
            <span className="text-sm text-stone-400">Reset code</span>
            <input value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
          </label>
          <label className="block">
            <span className="text-sm text-stone-400">New password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
          </label>
          <label className="block">
            <span className="text-sm text-stone-400">Confirm password</span>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
          </label>
          {status ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</p> : null}
          {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          <GoldButton disabled={loading} className="w-full" onClick={submit}>
            {loading ? "Updating..." : "Update Password"}
          </GoldButton>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

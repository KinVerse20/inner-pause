"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo, GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { upsertProfile } from "@/lib/mvp-storage";

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    upsertProfile({ fullName: name, email, onboardingCompleted: true });
    router.replace("/");
  };

  const showProviderNotice = (provider: string) => {
    window.alert(`${provider} sign-in is not connected in this demo build. Use the email mock account to continue.`);
  };

  return (
    <MvpShell hideNav>
      <div className="mx-auto max-w-xl space-y-5">
        <BrandLogo />
        <SectionTitle
          title={mode === "forgot" ? "Reset Password" : "Welcome"}
          copy="Created by professionals with approximately 15 years of experience in healing practices and emotional wellness. This local build keeps your session on this device until secure account services are connected."
        />
        <GlassCard className="space-y-4 p-5">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-sm text-stone-400">Name</span>
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
              <input type="password" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-stone-100" />
            </label>
          ) : null}
          <GoldButton className="w-full" onClick={submit}>
            {mode === "forgot" ? "Send Reset Link" : mode === "login" ? "Log In" : "Create Account"}
          </GoldButton>
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

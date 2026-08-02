"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { deleteAllLocalMvpData, signOutMockProfile, upsertProfile } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

export function ProfileScreen() {
  const router = useRouter();
  const state = useMvpState();
  const [name, setName] = useState(state.profile.fullName);
  const [email, setEmail] = useState(state.profile.email);
  const [phone, setPhone] = useState(state.profile.phone);
  const [signingOut, setSigningOut] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSignOut = () => {
    setSigningOut(true);
    setError("");
    setStatus("");
    try {
      signOutMockProfile();
      window.sessionStorage.clear();
      setStatus("Signed out successfully.");
      router.replace("/auth");
    } catch {
      setError("Sign out failed. Please try again.");
      setSigningOut(false);
    }
  };

  const handleDeleteData = () => {
    const confirmed = window.confirm("Delete all local journal, insight and session data on this device?");
    if (!confirmed) return;
    deleteAllLocalMvpData();
    setName("");
    setEmail("");
    setPhone("");
    setStatus("Local data deleted.");
    router.replace("/onboarding");
  };

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <SectionTitle title="Profile" copy="Preferences, privacy controls and mock guidance." />

        <GlassCard className="space-y-3 p-3.5">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-[var(--gold-border)] bg-purple-500/14 text-2xl text-[var(--gold-light)]">☾</div>
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Email" value={email} onChange={setEmail} />
          <Input label="Phone" value={phone} onChange={setPhone} />
          <GoldButton
            onClick={() => {
              upsertProfile({ fullName: name, email, phone });
              setStatus("Profile saved on this device.");
              setError("");
            }}
          >
            Save Profile
          </GoldButton>
        </GlassCard>

        <GlassCard className="space-y-2 p-3.5">
          {status ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</p> : null}
          {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="min-h-11 w-full rounded-full border border-white/10 px-4 py-2.5 text-stone-300 disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={handleDeleteData} className="min-h-11 rounded-full border border-red-300/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">Delete data</button>
            <button
              type="button"
              onClick={() => window.alert("Account deletion will be available when secure account services are connected. Use Delete data to clear this device now.")}
              className="min-h-11 rounded-full border border-red-300/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-100"
            >
              Delete account
            </button>
          </div>
        </GlassCard>

        <details className="rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--background-card)] p-3.5">
          <summary className="cursor-pointer font-serif text-xl text-[var(--gold-light)]">Healing preferences</summary>
          <Preference label="Preferred session duration" value={`${state.profile.preferredSessionDuration} min`} />
          <Preference label="Preferred guide voice" value={state.profile.preferredVoice} />
          <Preference label="Music style" value={state.profile.preferredMusicStyle} />
          <Preference label="Guidance level" value={state.profile.preferredGuidanceLevel} />
          <Preference label="Affirmations" value={state.profile.affirmationsEnabled ? "Enabled" : "Disabled"} />
          <Preference label="Nature sounds" value={state.profile.natureSoundsEnabled ? "Enabled" : "Disabled"} />
        </details>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[var(--gold-light)]">What the app has learned</h2>
          <p className="mt-2 text-sm leading-5 text-stone-300">
            Long-term pattern memory is {state.profile.aiMemoryEnabled ? "enabled" : "disabled"}. You can correct or delete patterns from Insights as the app learns more.
          </p>
          <button
            type="button"
            onClick={() => upsertProfile({ aiMemoryEnabled: !state.profile.aiMemoryEnabled })}
            className="mt-3 min-h-10 rounded-full border border-[var(--gold-border-soft)] px-4 py-2 text-sm text-[var(--gold-light)]"
          >
            {state.profile.aiMemoryEnabled ? "Disable memory" : "Enable memory"}
          </button>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/guidance" className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-stone-100">WhatsApp preferences</Link>
          <Link href="/about" className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-stone-100">About Us</Link>
        </div>
      </div>
    </MvpShell>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-stone-400">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 p-2.5 text-stone-100 outline-none" />
    </label>
  );
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-sm">
      <span className="text-stone-400">{label}</span>
      <span className="text-stone-100">{value}</span>
    </div>
  );
}

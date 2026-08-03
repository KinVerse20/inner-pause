"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { clearFrontendSession } from "@/lib/auth/session";
import { deleteAllLocalMvpData, upsertProfile } from "@/lib/mvp-storage";
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
    void (async () => {
      try {
        clearFrontendSession();
        window.sessionStorage.clear();
        setStatus("Signed out successfully.");
        router.replace("/auth");
      } catch {
        setError("Sign out failed. Please try again.");
        setSigningOut(false);
      }
    })();
  };

  const handleSaveProfile = async () => {
    setStatus("");
    setError("");
    try {
      upsertProfile({ fullName: name, email, phone });
      setStatus("Profile saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile.");
    }
  };

  const handleDeleteData = () => {
    const confirmed = window.confirm("Delete all local reflection, insight and session data on this device?");
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
        <SectionTitle title="Profile" copy="Preferences, privacy controls and gentle guidance." />

        <GlassCard className="space-y-3 p-3.5">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-purple-200 bg-purple-100 text-2xl text-[#6d28d9]">☾</div>
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Email" value={email} onChange={setEmail} />
          <Input label="Phone" value={phone} onChange={setPhone} />
          <GoldButton onClick={handleSaveProfile}>
            Save Profile
          </GoldButton>
        </GlassCard>

        <GlassCard className="space-y-2 p-3.5">
          {status ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{status}</p> : null}
          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="min-h-11 w-full rounded-full border border-purple-200 bg-white px-4 py-2.5 text-[#6d28d9] disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={handleDeleteData} className="min-h-11 rounded-full border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">Delete data</button>
            <button
              type="button"
              onClick={() => window.alert("Account deletion will be available when secure account services are connected. Use Delete data to clear this device now.")}
              className="min-h-11 rounded-full border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              Delete account
            </button>
          </div>
        </GlassCard>

        <details className="rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--background-card)] p-3.5">
          <summary className="cursor-pointer font-serif text-xl text-[#130b4f]">Healing preferences</summary>
          <Preference label="Preferred session duration" value={`${state.profile.preferredSessionDuration} min`} />
          <Preference label="Preferred guide voice" value={state.profile.preferredVoice} />
          <Preference label="Music style" value={state.profile.preferredMusicStyle} />
          <Preference label="Guidance level" value={state.profile.preferredGuidanceLevel} />
          <Preference label="Affirmations" value={state.profile.affirmationsEnabled ? "Enabled" : "Disabled"} />
          <Preference label="Nature sounds" value={state.profile.natureSoundsEnabled ? "Enabled" : "Disabled"} />
        </details>

        <GlassCard className="p-3.5">
          <h2 className="font-serif text-xl text-[#130b4f]">Pattern memory</h2>
          <p className="mt-2 text-sm leading-5 text-[#4b3f86]">
            Long-term pattern memory is {state.profile.aiMemoryEnabled ? "enabled" : "disabled"}. You can correct or delete patterns from Insights as The Inner Pause learns more.
          </p>
          <button
            type="button"
            onClick={() => upsertProfile({ aiMemoryEnabled: !state.profile.aiMemoryEnabled })}
            className="mt-3 min-h-10 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm text-[#6d28d9]"
          >
            {state.profile.aiMemoryEnabled ? "Disable memory" : "Enable memory"}
          </button>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/guidance" className="rounded-2xl border border-purple-100 bg-white/70 p-3 text-[#26156f]">WhatsApp preferences</Link>
          <Link href="/about" className="rounded-2xl border border-purple-100 bg-white/70 p-3 text-[#26156f]">About Us</Link>
        </div>
      </div>
    </MvpShell>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-[#4b3f86]">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="soft-input mt-1 w-full rounded-2xl p-2.5 outline-none" />
    </label>
  );
}

function Preference({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-purple-100 pt-4 text-sm">
      <span className="text-[#6d5ea8]">{label}</span>
      <span className="text-[#26156f]">{value}</span>
    </div>
  );
}

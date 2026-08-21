"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { upsertProfile } from "@/lib/mvp-storage";

// Landing / Entry (this pass's brief §2/§3): the one-time first-entry
// screen for a brand-new device — quiet, single CTA, no questions, no
// account required. Replaces the old 5-step questionnaire entirely
// (components/entry-gate.tsx redirects here instead of /onboarding).
// Returning users never see this — the gate only fires once, ever, per
// device (docs/PRODUCT_FLOW.md §3/§39.A: "Landing/Entry -> Home -> first
// Pause," no mandatory step before first value).
export function EntryScreen() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  const handleBegin = () => {
    if (entering) return;
    setEntering(true);
    upsertProfile({ onboardingCompleted: true });
    router.replace("/");
  };

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)" }}
    >
      <HarmonyFormVisual playing={false} progress={0} className="h-40 w-40" />

      <div className="space-y-2">
        <h1 className="text-[1.3rem] font-semibold tracking-[-0.01em]">The Inner Pause</h1>
        <p className="max-w-[20rem] text-[0.95rem]" style={{ color: "var(--ds-text-secondary)" }}>
          Come in. Take your first Pause.
        </p>
      </div>

      <button
        type="button"
        onClick={handleBegin}
        disabled={entering}
        className="ds-tap min-h-12 rounded-full px-8 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
      >
        {entering ? "Opening…" : "Begin"}
      </button>

      <p className="max-w-[18rem] text-[0.72rem]" style={{ color: "var(--ds-text-muted)" }}>
        No account needed. Your first Pause is one tap away.
      </p>
    </div>
  );
}

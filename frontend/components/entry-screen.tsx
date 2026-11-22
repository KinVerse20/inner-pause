"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { haptic } from "@/lib/haptics";
import { upsertProfile } from "@/lib/mvp-storage";

// Landing / Entry — the one true brand moment (BRAND_IDENTITY.md Harmony
// Form board): the mark breathing at the center, the wordmark, the line
// "Pause the noise. Return to you." Nothing else competes; the single
// action sits in the thumb zone.
export function EntryScreen() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  const handleBegin = () => {
    if (entering) return;
    haptic("moment");
    setEntering(true);
    upsertProfile({ onboardingCompleted: true });
    router.replace("/");
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
          <HarmonyFormVisual playing className="ds-only-light w-[min(58vw,15rem)]" />
          <HarmonyFormVisual playing dark className="ds-only-dark w-[min(58vw,15rem)]" />
          <p className="mt-10 text-[1.15rem] font-semibold tracking-[0.34em]" style={{ color: "var(--ds-text)" }}>
            INNER PAUSE
          </p>
          <span className="mt-4 h-px w-8" style={{ background: "var(--ds-accent-secondary)" }} aria-hidden="true" />
          <h1 className="mt-4 text-[1.35rem] font-semibold leading-snug tracking-[-0.01em]">
            Pause the noise.
            <br />
            Return to you.
          </h1>
          <p className="mt-3 max-w-[17rem] text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            A quiet space for whatever life is bringing right now.
          </p>
        </div>

        <div className="ds-settle w-full space-y-4" style={{ animationDelay: "0.12s" }}>
          <button type="button" onClick={handleBegin} disabled={entering} className="ds-filled w-full">
            {entering ? "Opening" : "Begin"}
          </button>
          <p className="ds-caption tracking-[0.18em]" style={{ color: "var(--ds-text-muted)" }}>
            HARMONY · RESONANCE · FLOW
          </p>
        </div>
      </div>
    </div>
  );
}

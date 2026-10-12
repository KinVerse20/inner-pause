"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { LandscapeScene } from "@/components/landscape-scene";
import { upsertProfile } from "@/lib/mvp-storage";

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
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}
    >
      <LandscapeScene variant="day" className="pointer-events-none absolute inset-0 h-full w-full scale-[1.12]" />
      <div className="relative z-10 flex min-h-dvh flex-col px-8 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))]">
        <div className="ds-settle flex-1">
          <h1 className="ds-display text-[3.15rem] sm:text-[3.5rem]">Inner Pause</h1>
          <p className="mt-3 max-w-[16rem] text-[1.05rem] leading-7" style={{ color: "var(--ds-text-secondary)" }}>
            A calmer you for a more human life.
          </p>
        </div>

        <div className="ds-settle space-y-5" style={{ animationDelay: "0.14s" }}>
          <p className="text-[0.82rem] tracking-[0.04em]" style={{ color: "var(--ds-text-muted)" }}>
            Pause. Breathe. Be here.
          </p>
          <button
            type="button"
            onClick={handleBegin}
            disabled={entering}
            className="ds-filled ds-tap w-full max-w-[12rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {entering ? "Opening…" : "Begin"}
          </button>
        </div>
      </div>
    </div>
  );
}

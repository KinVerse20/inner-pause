"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChakraInspirationTag } from "@/components/chakra-inspiration-tag";
import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { PauseCategory, startQuickPause } from "@/lib/pause-categories";

export function PauseDetailScreen({ category }: { category: PauseCategory }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const chakra = chakraMap[category.chakraId];

  const start = () => {
    if (starting) return;
    setStarting(true);
    const plan = startQuickPause(category.id);
    if (!plan) {
      setStarting(false);
      return;
    }
    router.push(`/healing/player?plan=${plan.id}`);
  };

  return (
    <MvpShell>
      <div className="mx-auto max-w-xl space-y-3.5">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ip-border)] bg-white/70 text-[var(--ip-ink)]"
          aria-label="Back to Pause"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <GlassCard tone={category.tone} className="p-6 text-center">
          <h1 className="font-serif text-3xl leading-tight text-[var(--ip-ink)]">
            {category.label} Pause
          </h1>
          <p className="mt-2 text-sm leading-5 text-[var(--ip-body)]">{category.tagline}.</p>
          <div className="mt-2 flex justify-center">
            <ChakraInspirationTag chakraId={category.chakraId} />
          </div>

          <div className="ip-blob-float relative mx-auto mt-6 grid aspect-square w-[min(56vw,15rem)] place-items-center">
            <div
              className="ip-blob-shape absolute inset-0"
              style={{ background: `radial-gradient(circle at 40% 35%, ${chakra.accent}, ${chakra.color}55)` }}
            />
          </div>

          <p className="mt-6 text-xs text-[var(--ip-muted)]">10 min · Guided · {chakra.frequencyLabel}</p>
          <GoldButton className="mt-3 w-full" disabled={starting} onClick={start}>
            {starting ? "Preparing..." : "Start Pause"}
          </GoldButton>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

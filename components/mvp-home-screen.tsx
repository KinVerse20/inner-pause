"use client";

import Link from "next/link";

import { AppPageHeader, ChakraPath } from "@/components/chakra-path-ui";
import { GlassCard, MvpShell } from "@/components/mvp-shell";
import { useMvpState } from "@/lib/use-mvp-state";

const pathSteps = [
  { title: "Express", copy: "Release what’s within" },
  { title: "Relief", copy: "Reset and restore" },
  { title: "Growth", copy: "Evolve with awareness" },
];

export function MvpHomeScreen() {
  const state = useMvpState();
  const firstName = state.profile.fullName?.split(" ")[0] || "Sahil";
  const latest = state.entries.find((entry) => entry.analysis);
  const activeChakras = latest?.analysis?.chakraAssociations.map((item) => item.chakra) ?? [];

  return (
    <MvpShell>
      <div className="space-y-3.5">
        <AppPageHeader />

        <section className="rounded-[1.75rem] border border-[var(--ip-border)] bg-white/72 px-5 py-4 text-center shadow-[0_18px_44px_rgba(108,62,244,0.1)]">
          <p className="font-serif text-2xl leading-tight text-[var(--ip-ink)]">Good morning, {firstName}</p>
          <p className="mt-1 text-sm text-[var(--ip-body)]">Take a breath. You’re in the right place.</p>
          <div className="mt-3">
            <ChakraPath active={activeChakras} compact />
          </div>
        </section>

        <GlassCard className="p-4">
          <h1 className="font-serif text-2xl leading-tight text-[var(--ip-ink)]">What is weighing on you right now?</h1>
          <p className="mt-1 text-sm leading-5 text-[var(--ip-body)]">Share freely. This is your space.</p>
          <Link href="/journal" className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full border border-purple-400/30 bg-[linear-gradient(135deg,var(--ip-purple-2),var(--ip-purple))] px-4 py-2.5 font-semibold text-white shadow-[0_12px_24px_rgba(108,62,244,0.22)]">
            Start Expressing <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <p className="font-serif text-xl text-[var(--ip-ink)]">Your Path</p>
            <p className="text-xs text-[var(--ip-muted)]">Immediate relief. Lasting emotional growth.</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {pathSteps.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-[var(--ip-border)] bg-white/74 p-3 text-center">
                {index < pathSteps.length - 1 ? <span className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 text-[var(--ip-purple)]">→</span> : null}
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-[var(--ip-lavender)] text-sm font-semibold text-[var(--ip-purple)]">{index + 1}</span>
                <p className="mt-2 text-sm font-semibold text-[var(--ip-ink)]">{step.title}</p>
                <p className="mt-1 text-[0.72rem] leading-4 text-[var(--ip-muted)]">{step.copy}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

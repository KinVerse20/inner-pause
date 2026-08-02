"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BrandLogo, GoldButton, GlassCard } from "@/components/mvp-shell";
import { upsertProfile } from "@/lib/mvp-storage";

const steps = [
  {
    title: "Your day holds clues to what you need.",
    copy: "Write or speak about what happened. One honest sentence is enough.",
  },
  {
    title: "Understand the emotions beneath your day.",
    copy: "The InnerPause identifies key incidents, emotions and traditional chakra themes for review.",
  },
  {
    title: "Receive a healing journey made for you.",
    copy: "A personalised sequence selects reusable audio blocks for reflection, breathing and meditation.",
  },
];

export function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const step = steps[index];

  const finish = () => {
    upsertProfile({ onboardingCompleted: true });
    router.replace("/");
  };

  return (
    <main className="mvp-bg flex min-h-dvh items-start justify-center overflow-x-hidden px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:items-center">
      <GlassCard className="relative w-full max-w-md overflow-hidden p-5">
        <div className="pointer-events-none absolute inset-x-8 top-28 h-32 rounded-full mvp-energy-wave" />
        <div className="rounded-[1.4rem] border border-[var(--gold-border-soft)] p-5 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold-muted)]">Heal Within</p>
          <BrandLogo className="mt-4 justify-center" />
          <h1 className="mt-5 whitespace-pre-line font-serif text-5xl leading-[0.92] text-[var(--gold-light)]">
            {"Heal Within.\nLive Aligned."}
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-stone-300">
            Journal your day. Uncover your emotions. Receive a personalised healing session for you.
          </p>

          <div className="relative mx-auto mt-8 grid h-64 place-items-center">
            <div className="mvp-meditator">
              {["#ef654d", "#f39c3d", "#f4b52e", "#74be62", "#4abce9", "#7177ed", "#a76be8"].map((color, dotIndex) => (
                <span
                  key={color}
                  className="chakra-dot"
                  style={{ color, top: `${74 - dotIndex * 9}%` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-7 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 text-left">
            <h2 className="font-serif text-2xl leading-tight text-[var(--gold-light)]">{step.title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">{step.copy}</p>
          </div>

          <div className="mt-5 flex justify-center gap-2" aria-label="Onboarding progress">
            {steps.map((item, dotIndex) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Go to step ${dotIndex + 1}`}
                onClick={() => setIndex(dotIndex)}
                className={`h-2 rounded-full transition ${dotIndex === index ? "w-9 bg-[var(--gold-primary)]" : "w-2 bg-stone-600"}`}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            <GoldButton onClick={index === steps.length - 1 ? finish : () => setIndex((value) => value + 1)}>
              {index === 0 ? "Begin Your Healing Journey" : index === steps.length - 1 ? "Enter App" : "Next"}
            </GoldButton>
            <button type="button" onClick={finish} className="min-h-11 rounded-full text-sm text-stone-300">
              Skip
            </button>
            <button type="button" onClick={() => router.push("/auth")} className="text-sm text-[var(--gold-muted)]">
              I already have an account
            </button>
          </div>

          <p className="mt-5 text-xs leading-5 text-stone-500">
            The InnerPause supports reflection and emotional wellbeing. It is not a substitute for professional medical or mental-health care.
          </p>
        </div>
      </GlassCard>
    </main>
  );
}

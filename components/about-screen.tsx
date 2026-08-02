import Link from "next/link";
import Image from "next/image";

import { BrandLogo, GlassCard, MvpShell, SectionTitle } from "@/components/mvp-shell";

const steps = [
  {
    title: "Journal or speak",
    copy: "Share what happened, describe how you feel or simply ask for a quick reset.",
    icon: "✎",
  },
  {
    title: "Receive insight",
    copy: "The InnerPause identifies the emotions, important incidents and areas within you that may need gentle attention.",
    icon: "◎",
  },
  {
    title: "Start healing",
    copy: "Receive a personalised session using calming sound, breathwork, guided reflection and carefully selected frequency-based soundscapes.",
    icon: "✦",
  },
];

const cards = [
  {
    title: "Short-term healing",
    icon: "◌",
    copy: "When you need support immediately, The InnerPause creates short, personalised healing sessions designed to help you slow down, settle your emotions and feel lighter in the moment.\n\nThese experiences may combine calming soundscapes, gentle breathing, guided reflection and frequency-based audio.",
  },
  {
    title: "Long-term healing",
    icon: "☾",
    copy: "Your daily reflections gradually reveal recurring emotions, triggers and behavioural patterns. The InnerPause helps you recognise these patterns with greater clarity so you can build emotional awareness and respond more consciously over time.\n\nYour journal is not only a record of your day. It becomes a private space for reflection, release and personal growth.",
  },
  {
    title: "Why sound and frequency?",
    icon: "≈",
    copy: "The human body naturally responds to sound, rhythm and vibration. Music and thoughtfully designed sound environments can influence breathing, attention, relaxation and emotional state.\n\nThe InnerPause uses carefully selected frequency-based soundscapes as part of a broader reflective wellness experience. These sounds are designed to support calm, focus and emotional balance.",
  },
];

export function AboutScreen() {
  return (
    <MvpShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo />
          <Link href="/journal" className="hidden rounded-full border border-[var(--gold-border-soft)] px-4 py-2 text-sm text-[var(--gold-light)] sm:inline-flex">
            Begin
          </Link>
        </header>

        <GlassCard className="relative overflow-hidden p-5 sm:p-8">
          <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-56 w-56 rounded-full mvp-orb opacity-55" />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_12rem] sm:items-center">
            <div>
              <SectionTitle
                eyebrow="About The InnerPause"
                title="A daily ritual for release, reflection and renewal"
                copy="Turn your day into a personalised healing experience. The InnerPause helps you feel lighter in the moment and understand yourself more deeply over time."
              />
            </div>
            <div className="mx-auto overflow-hidden rounded-[2rem] border border-[var(--gold-border-soft)] bg-black/25 p-3 shadow-[0_0_50px_rgba(178,89,231,0.2)]">
              <Image src="/branding/innerpause-logo-small.png" alt="The InnerPause logo" width={900} height={396} className="h-auto w-48 rounded-[1.4rem]" priority />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">How it works</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--gold-border-soft)] text-[var(--gold-light)]">{step.icon}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-[var(--gold-muted)]">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl text-stone-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-300">{step.copy}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <GlassCard key={card.title} className="p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] text-xl text-[var(--gold-light)]">{card.icon}</span>
              <h2 className="mt-4 font-serif text-2xl text-[var(--gold-light)]">{card.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-stone-300">
                {card.copy.split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-5 sm:p-6">
          <h2 className="font-serif text-3xl text-[var(--gold-light)]">Built with experience and care</h2>
          <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
            The InnerPause has been shaped by professionals with approximately 15 years of experience working with healing practices, emotional wellness and guided personal transformation.
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-300 sm:text-base">
            That experience has been used to create a thoughtful daily practice that combines reflection, sound and personalised guidance in a simple and accessible format.
          </p>
          <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-stone-400">
            Every experience inside The InnerPause is designed with care, responsibility and respect for the user’s emotional privacy.
          </p>
        </GlassCard>

        <GlassCard className="p-5 text-center sm:p-7">
          <h2 className="font-serif text-3xl text-[var(--gold-light)]">Begin Your Journey</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-300">
            A gentle daily practice for emotional awareness and inner calm.
          </p>
          <Link
            href="/journal"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--gold-border)] bg-[linear-gradient(135deg,rgba(244,189,94,0.95),rgba(178,89,231,0.55))] px-5 py-3 font-semibold text-[#120b16] shadow-[0_0_28px_rgba(244,189,94,0.18)] transition hover:brightness-110"
          >
            Begin Your Journey
          </Link>
          <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-stone-500">
            The InnerPause supports reflection and emotional wellbeing. It is not a substitute for professional medical or mental-health care.
          </p>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

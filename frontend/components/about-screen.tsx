import Link from "next/link";

import { BlushCard, SunriseScene } from "@/components/morning-blush-ui";
import { BrandLogo, MvpShell } from "@/components/mvp-shell";

const steps = [
  {
    title: "Share or speak",
    copy: "Share what happened, describe how you feel or simply ask for a quick reset.",
    icon: "✎",
  },
  {
    title: "Receive insight",
    copy: "The Inner Pause identifies the emotions, important incidents and areas within you that may need gentle attention.",
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
    copy: "When you need support immediately, The Inner Pause creates short, personalised reset sessions designed to help you slow down, settle your emotions and feel lighter in the moment.\n\nThese experiences may combine calming soundscapes, gentle breathing, guided reflection and frequency-based audio.",
  },
  {
    title: "Long-term healing",
    icon: "☾",
    copy: "Your daily reflections gradually reveal recurring emotions, triggers and behavioural patterns. The Inner Pause helps you recognise these patterns with greater clarity so you can build emotional awareness and respond more consciously over time.\n\nYour journey is a private space for reflection, release and personal growth.",
  },
  {
    title: "Why sound and frequency?",
    icon: "≈",
    copy: "The human body naturally responds to sound, rhythm and vibration. Music and thoughtfully designed sound environments can influence breathing, attention, relaxation and emotional state.\n\nThe Inner Pause uses carefully selected frequency-based soundscapes as part of a broader reflective wellness experience. These sounds are designed to support calm, focus and emotional balance.",
  },
];

export function AboutScreen() {
  return (
    <MvpShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo />
          <Link href="/journal" className="hidden rounded-full border border-[var(--gold-border-soft)] bg-white/68 px-4 py-2 text-sm text-[var(--gold-light)] sm:inline-flex">
            Begin
          </Link>
        </header>

        <SunriseScene>
          <div className="grid min-h-[clamp(28rem,62dvh,34rem)] place-items-center px-5 py-8 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/68 text-5xl text-[var(--gold-light)] shadow-[0_0_44px_rgba(169,139,221,0.16)]">
                ♧
              </div>
              <h1 className="font-serif text-[clamp(2.2rem,7vw,4.8rem)] leading-tight text-[var(--ip-ink)]">A ritual for your well-being.</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--ip-body)]">Short-term relief. Long-term transformation.</p>
            </div>
          </div>
        </SunriseScene>

        <BlushCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">How it works</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-[1.1rem] border border-[var(--gold-border-soft)] bg-white/58 p-4">
                <span className="text-xs uppercase tracking-[0.22em] text-[var(--gold-muted)]">0{index + 1}</span>
                <h3 className="mt-3 font-serif text-xl text-[var(--ip-ink)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{step.copy}</p>
              </div>
            ))}
          </div>
        </BlushCard>

        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <BlushCard key={card.title} className="p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] text-xl text-[var(--gold-light)]">{card.icon}</span>
              <h2 className="mt-4 font-serif text-2xl text-[var(--gold-light)]">{card.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--ip-body)]">
                {card.copy.split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </BlushCard>
          ))}
        </div>

        <BlushCard className="p-5 sm:p-6">
          <h2 className="font-serif text-3xl text-[var(--gold-light)]">Built with experience and care</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--ip-body)] sm:text-base">
            The Inner Pause has been shaped by professionals with approximately 15 years of experience working with healing practices, emotional wellness and guided personal transformation.
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--ip-body)] sm:text-base">
            That experience has been used to create a thoughtful daily practice that combines reflection, sound and personalised guidance in a simple and accessible format.
          </p>
          <p className="mt-4 border-t border-[var(--gold-border-soft)] pt-4 text-sm leading-6 text-[var(--ip-muted)]">
            Every experience inside The Inner Pause is designed with care, responsibility and respect for the user’s emotional privacy.
          </p>
        </BlushCard>

        <BlushCard className="p-5 text-center sm:p-7">
          <h2 className="font-serif text-3xl text-[var(--gold-light)]">Begin Your Journey</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--ip-body)]">
            A gentle daily practice for emotional awareness and inner calm.
          </p>
          <Link
            href="/journal"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-white/70 bg-[linear-gradient(135deg,#a98bdd,#f4b8cd_62%,#f5b792)] px-5 py-3 font-semibold text-white shadow-[0_16px_34px_rgba(169,139,221,0.22)] transition hover:brightness-110"
          >
            Begin Your Journey
          </Link>
          <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-[var(--ip-muted)]">
            The Inner Pause supports reflection and emotional wellbeing. It is not a substitute for professional medical or mental-health care.
          </p>
        </BlushCard>
      </div>
    </MvpShell>
  );
}

import Link from "next/link";

import { BlushCard } from "@/components/morning-blush-ui";
import { BrandLogo, MvpShell } from "@/components/mvp-shell";

const sections = [
  {
    title: "What InnerPause does",
    copy: "Helps you pause, express, and reset.",
    icon: "◌",
  },
  {
    title: "How it helps",
    copy: "Short-term relief. Long-term emotional awareness.",
    icon: "◎",
  },
  {
    title: "Why sound and reflection",
    icon: "≈",
    copy: "Sound creates a simple space to slow down and reconnect.",
  },
];

export function AboutScreen() {
  return (
    <MvpShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <BrandLogo />
          <Link href="/journal" className="hidden rounded-full border border-[rgba(255,138,42,0.34)] bg-[rgba(244,122,34,0.08)] px-4 py-2 text-sm text-[var(--gold-light)] sm:inline-flex">
            Begin
          </Link>
        </header>

        <section className="border-b border-white/10 pb-6 pt-2 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[rgba(255,138,42,0.24)] bg-white/[0.025] text-4xl text-[var(--gold-light)] shadow-[0_0_34px_rgba(255,138,42,0.1)]">
            ♧
          </div>
          <h1 className="mt-5 font-serif text-[clamp(2.3rem,7vw,4.8rem)] leading-tight text-[var(--ip-ink)]">About InnerPause</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--ip-body)]">
            A quiet place to reflect, release and return to yourself.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {sections.map((item) => (
            <BlushCard key={item.title} className="p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-xl text-[var(--gold-light)]">{item.icon}</span>
              <h2 className="mt-4 font-serif text-2xl text-[var(--ip-ink)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{item.copy}</p>
            </BlushCard>
          ))}
        </section>

        <BlushCard className="p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-serif text-3xl text-[var(--ip-ink)]">Privacy and care</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ip-body)]">
                Your reflections are treated as private personal wellness notes. InnerPause supports reflection and emotional wellbeing. It is not a substitute for professional medical or mental-health care.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Link href="/profile" className="min-h-11 rounded-full border border-white/10 px-4 py-2.5 text-sm uppercase tracking-[0.18em] text-[var(--ip-body)]">Privacy</Link>
              <Link href="/profile" className="min-h-11 rounded-full border border-white/10 px-4 py-2.5 text-sm uppercase tracking-[0.18em] text-[var(--ip-body)]">Contact</Link>
              <Link href="/profile" className="min-h-11 rounded-full border border-white/10 px-4 py-2.5 text-sm uppercase tracking-[0.18em] text-[var(--ip-body)]">Terms</Link>
            </div>
          </div>
        </BlushCard>

        <BlushCard className="p-5 sm:p-6">
          <h2 className="font-serif text-3xl text-[var(--ip-ink)]">Built with experience and care</h2>
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
          <h2 className="font-serif text-3xl text-[var(--ip-ink)]">Begin Your Journey</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--ip-body)]">
            A gentle daily practice for emotional awareness and inner calm.
          </p>
          <Link
            href="/journal"
            className="tap-ripple mt-5 inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(255,138,42,0.55)] bg-[rgba(244,122,34,0.12)] px-5 py-3 font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)] shadow-[0_0_28px_rgba(255,138,42,0.1)] transition hover:bg-[rgba(244,122,34,0.18)]"
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

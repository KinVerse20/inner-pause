"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PASS_LIST_PRICE_INR, PASS_PRICE_INR, TRIAL_PAUSES } from "@inner-pause/shared";

import { PauseShell } from "@/components/pause-shell";
import { IconChevronRight, IconFeather, IconMic, IconPencil, IconSliders } from "@/components/pause-icons";
import { NavHomeIcon, NavMomentsIcon, NavPracticeIcon, NavYouIcon } from "@/components/nav-icons";
import { Stagger, StaggerItem } from "@/components/reveal";
import { CHAKRA_GUIDE } from "@/lib/chakra-guide";
import { haptic } from "@/lib/haptics";
import { rupees } from "@/lib/pass-summary";

// Guide (a tab of its own): what Inner Pause is, how it helps, and how to
// use each part, with a way to try each one. Plain words, nothing promised
// that the app doesn't do.

const HELPS: Array<{ title: string; body: string }> = [
  { title: "Calm down in minutes", body: "When something hits, a short Pause of sound and slow breathing helps your body settle before you have to think." },
  { title: "Meet the big moments", body: "Before an interview, during a hard conversation, after a difficult day: a Pause made for that moment." },
  { title: "Build a steadier habit", body: "A 14 day Practice path gives you a few quiet minutes and one small task each day, so calm becomes something you practise." },
  { title: "See your own story", body: "What you felt, what you wrote and what helped stay in Journey, so you can look back and notice how far you have come." },
];

interface Step {
  title: string;
  body: string;
  icon: ReactNode;
  href?: string;
  cta?: string;
}

const icon = "h-5 w-5";

const STEPS: Step[] = [
  {
    title: "Take a quick Pause",
    body: "Tap the Pause button in the middle of the bar for a short Ground Pause, or pick how you feel from the tiles on Home.",
    icon: <NavHomeIcon active={false} className={icon} />,
    href: "/",
    cta: "Go to Home",
  },
  {
    title: "Tell Inner Pause what's on your mind",
    body: "Write it or say it, or just pick up to four feelings. You'll see the energy centres linked to them, then press Begin my Pause.",
    icon: <IconPencil className={icon} />,
    href: "/tell",
    cta: "Tell it now",
  },
  {
    title: "Use Moments for big moments",
    body: "Choose Coming up, Happening now or Just happened, pick the moment, and start a Pause made for it.",
    icon: <NavMomentsIcon active={false} className={icon} />,
    href: "/moments",
    cta: "Open Moments",
  },
  {
    title: "Follow a Practice path",
    body: "Pick a path such as Confidence or Sleep. Each day: a one minute check in, a few minutes of sound and one small task to carry into your day.",
    icon: <NavPracticeIcon active={false} className={icon} />,
    href: "/practice",
    cta: "See the paths",
  },
  {
    title: "During a Pause",
    body: "Breathe with the guide. Sound lets you change what you hear and how present the tone is. Skip frequency moves to the next energy centre, End session stops, and the arrow keeps it playing while you use the app.",
    icon: <IconSliders className={icon} />,
  },
  {
    title: "After a Pause",
    body: "Say how you feel now, and add a few words if you like. Journey keeps it with the rest of your story, and you can write in your journal any time.",
    icon: <NavYouIcon active={false} className={icon} />,
    href: "/journey",
    cta: "Open Journey",
  },
];

const TIPS = [
  "Headphones help, and Binaural and Mindspace need them.",
  "A quiet spot and a comfortable seat are enough. Eyes open or closed.",
  "The same time each day makes Practice easier. Turn on its reminder.",
  "Nothing to get right: if your mind wanders, the next breath is a fresh start.",
];

export function GuideScreen() {
  return (
    <PauseShell>
      <Stagger className="space-y-7 pb-4 pt-2">
        <StaggerItem>
          <header>
            <h1 className="ds-display text-[1.85rem]">Guide</h1>
            <p className="mt-1.5 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Inner Pause gives you short guided Pauses of sound tuned to a frequency, with slow breathing, to steady you in a few minutes.
            </p>
          </header>
        </StaggerItem>

        <StaggerItem>
          <Section id="guide-helps" title="How it helps you">
            <ul className="grid gap-3 sm:grid-cols-2">
              {HELPS.map((item) => (
                <li key={item.title} className="ds-card px-4 py-4">
                  <span className="flex items-center gap-2.5">
                    <IconFeather className="h-4 w-4 shrink-0" style={{ color: "var(--ds-accent)" }} />
                    <span className="ds-h3">{item.title}</span>
                  </span>
                  <p className="mt-1.5 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section id="guide-how" title="How to use it">
            <ol className="ds-card divide-y divide-[color:var(--ds-border)]">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3.5 px-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }} aria-hidden="true">
                    {step.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="ds-label block uppercase" style={{ color: "var(--ds-text-muted)" }}>
                      Step {index + 1}
                    </span>
                    <span className="ds-h3 mt-0.5 block">{step.title}</span>
                    <span className="mt-1 block text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                      {step.body}
                    </span>
                    {step.href && step.cta ? (
                      <Link
                        href={step.href}
                        onClick={() => haptic("tap")}
                        className="ds-tap -mb-2 mt-1 inline-flex min-h-11 items-center gap-1 text-[0.9rem] font-semibold"
                        style={{ color: "var(--ds-accent)" }}
                      >
                        {step.cta}
                        <IconChevronRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section id="guide-sound" title="Sound and frequencies">
            <div className="ds-card px-4 py-4">
              <p className="text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                Each Pause is tuned to the frequency traditionally linked with one of seven energy centres. The player always shows which one is playing.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="The seven energy centres">
                {[...CHAKRA_GUIDE].reverse().map((centre) => (
                  <li key={centre.id} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8rem]" style={{ background: "var(--ds-surface)", boxShadow: "inset 0 0 0 1px var(--ds-border)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: centre.color }} aria-hidden="true" />
                    {centre.name} <span className="ds-num" style={{ color: "var(--ds-text-muted)" }}>{centre.frequencyHz} Hz</span>
                  </li>
                ))}
              </ul>
              <Link href="/chakras" onClick={() => haptic("tap")} className="ds-tap -mb-2 mt-2 inline-flex min-h-11 items-center gap-1 text-[0.9rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
                Read about the energy centres
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section id="guide-pass" title="Your trial and the Pass">
            <div className="ds-card px-4 py-4">
              <p className="text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                A new account gets {TRIAL_PAUSES} trial Pauses. Each one asks you to confirm before it starts. After that, the Inner Pause Pass opens everything for a year
                {PASS_PRICE_INR < PASS_LIST_PRICE_INR ? (
                  <>
                    {" "}for <s>{rupees(PASS_LIST_PRICE_INR)}</s> <span className="font-semibold" style={{ color: "var(--ds-text)" }}>{rupees(PASS_PRICE_INR)}</span>.
                  </>
                ) : (
                  <> for {rupees(PASS_PRICE_INR)}.</>
                )}{" "}
                It never renews by itself.
              </p>
              <Link href="/profile/pass" onClick={() => haptic("tap")} className="ds-tap -mb-2 mt-1 inline-flex min-h-11 items-center gap-1 text-[0.9rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
                See the Pass
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section id="guide-tips" title="Tips">
            <ul className="ds-card space-y-2.5 px-4 py-4">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--ds-accent)" }} aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </Section>
        </StaggerItem>

        <StaggerItem className="space-y-3">
          <p className="text-[0.85rem] leading-6" style={{ color: "var(--ds-text-muted)" }}>
            Inner Pause supports everyday wellbeing. It is not a substitute for medical or mental health care.
          </p>
          <Link href="/tell" onClick={() => haptic("tap")} className="ds-filled ds-tap flex w-full items-center justify-center gap-2">
            <IconMic className="h-4 w-4" />
            Start with what&rsquo;s on your mind
          </Link>
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

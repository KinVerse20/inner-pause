"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_TELL_EMOTIONS, PASS_LIST_PRICE_INR, PASS_PRICE_INR, TRIAL_PAUSES, planFeelingStops } from "@inner-pause/shared";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { IconCheck, IconChevronDown, IconFeather, IconMic, IconSliders } from "@/components/pause-icons";
import { NavMomentsIcon, NavPracticeIcon, NavYouIcon } from "@/components/nav-icons";
import { Reveal } from "@/components/reveal";
import { BREATH_IN_SECONDS, BREATH_OUT_SECONDS, breathCountAt } from "@/lib/breath-count";
import { CHAKRA_GUIDE } from "@/lib/chakra-guide";
import { haptic } from "@/lib/haptics";
import { rememberSource } from "@/lib/install-prompt";
import { rupees } from "@/lib/pass-summary";

// /welcome: where the Instagram ads land. A short, descriptive tour that
// lets people feel it before they install: one breath with us, the Pause the
// app would make for how they feel (the app's own planner, so it's true),
// the seven centres, what's inside, the price, and a few honest answers.
// Every way on keeps the ad's utm_ tags (to /install, then sign up).

const FEELINGS = ["Anxiety", "Overthinking", "Overwhelm", "Sadness", "Anger", "Loneliness", "Self-doubt", "Lack of purpose"];
const PAUSE_SECONDS = 10 * 60;
const DEMO_BREATHS = 3;

const CENTRE = Object.fromEntries(CHAKRA_GUIDE.map((centre) => [centre.id, centre]));

const HELPS = [
  { title: "Calm in minutes", body: "Sound and slow breathing settle your body before your mind has to catch up." },
  { title: "Ready for big moments", body: "A Pause for before an interview, during a hard talk or after a long day." },
  { title: "A habit that holds", body: "Fourteen small days at a time, with one task to carry into each one." },
  { title: "Your own story", body: "What you felt and what helped, kept privately so you can see how far you've come." },
];

const FEATURES: Array<{ title: string; body: string; icon: ReactNode }> = [
  { title: "Quick Pause", body: "One tap, three minutes, steadier.", icon: <PauseGlyph /> },
  { title: "Tell it", body: "Write or say what's on your mind, in English or Hindi.", icon: <IconMic className="h-5 w-5" /> },
  { title: "Moments", body: "Before, during and after the moments that matter.", icon: <NavMomentsIcon active={false} className="h-5 w-5" /> },
  { title: "Practice paths", body: "Confidence, calm, focus, sleep and more, 14 days each.", icon: <NavPracticeIcon active={false} className="h-5 w-5" /> },
  { title: "Your sound", body: "Rain, ocean, deep ambient or binaural, tuned to your Pause.", icon: <IconSliders className="h-5 w-5" /> },
  { title: "Journey", body: "A private journal and the story of your Pauses.", icon: <NavYouIcon active={false} className="h-5 w-5" /> },
];

const FAQ = [
  { q: "Is this meditation?", a: "It's gentler than that. A Pause guides your breath with sound for a few minutes. Nothing to get right, and no experience needed." },
  { q: "Do I need headphones?", a: "Not for most sounds. Binaural and Mindspace need them, and everything sounds richer with them." },
  { q: "What do the frequencies do?", a: "Each Pause is tuned to a frequency traditionally linked with one of seven energy centres. The research is still young, so we offer it as something gentle to try, not a promise." },
  { q: "How does paying work?", a: `Your first ${TRIAL_PAUSES} Pauses are free. After that the Pass is ${rupees(PASS_PRICE_INR)} for a year, paid once. It never renews by itself.` },
  { q: "Is it a replacement for therapy?", a: "No. Inner Pause supports everyday wellbeing. It isn't medical or mental health care." },
];

export function WelcomeScreen() {
  const [search, setSearch] = useState("");

  useEffect(() => {
    rememberSource(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(window.location.search);
  }, []);

  const installHref = `/install${search}`;

  return (
    <div className="min-h-dvh overflow-x-hidden" style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}>
      <Hero installHref={installHref} />

      <main className="mx-auto w-full max-w-[34rem] space-y-20 px-4 pb-16 pt-14 sm:px-6 md:max-w-[44rem]">
        <Reveal>
          <BreathDemo />
        </Reveal>

        <Reveal>
          <FeelingPicker installHref={installHref} />
        </Reveal>

        <Reveal>
          <Section eyebrow="How it helps" title="Small Pauses, real difference">
            <ul className="grid gap-3 sm:grid-cols-2">
              {HELPS.map((item, index) => (
                <li key={item.title} className="ds-card relative overflow-hidden px-5 py-5">
                  <span className="ds-num absolute right-4 top-3 text-[2.2rem] font-semibold leading-none" style={{ color: "var(--ds-accent-soft)" }} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="flex items-center gap-2">
                    <IconFeather className="h-4 w-4 shrink-0" style={{ color: "var(--ds-accent)" }} />
                    <span className="ds-h3">{item.title}</span>
                  </span>
                  <p className="mt-1.5 text-[0.92rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        <Reveal>
          <Section eyebrow="Inside the app" title="Everything you need, nothing you don't">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="ds-card px-4 py-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }} aria-hidden="true">
                    {feature.icon}
                  </span>
                  <p className="ds-h3 mt-3">{feature.title}</p>
                  <p className="mt-1 text-[0.85rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                    {feature.body}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </Reveal>

        <Reveal>
          <CentresBand />
        </Reveal>

        <Reveal>
          <Pricing installHref={installHref} />
        </Reveal>

        <Reveal>
          <Section eyebrow="Questions" title="Good to know">
            <div className="ds-card divide-y divide-[color:var(--ds-border)]">
              {FAQ.map((item) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </Section>
        </Reveal>
      </main>

      <FinalCall installHref={installHref} />

      <footer className="flex flex-wrap justify-center gap-x-5 gap-y-1 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 text-[0.82rem]" style={{ color: "var(--ds-text-muted)" }}>
        <Link href="/terms" className="ds-tap inline-flex min-h-11 items-center underline underline-offset-4">Terms</Link>
        <Link href="/privacy-policy" className="ds-tap inline-flex min-h-11 items-center underline underline-offset-4">Privacy</Link>
        <Link href="/refund-policy" className="ds-tap inline-flex min-h-11 items-center underline underline-offset-4">Refunds</Link>
      </footer>
    </div>
  );
}

function Hero({ installHref }: { installHref: string }) {
  return (
    <header
      className="relative overflow-hidden px-4 pb-14 pt-[calc(2.5rem+env(safe-area-inset-top))] text-center"
      style={{ background: "radial-gradient(120% 70% at 50% 0%, #3b3590 0%, #262357 45%, #1a1840 100%)", color: "var(--ds-on-navy)" }}
    >
      {/* Soft lights drifting behind the rings. */}
      <span className="welcome-orb welcome-orb--a" aria-hidden="true" />
      <span className="welcome-orb welcome-orb--b" aria-hidden="true" />
      <div className="relative mx-auto max-w-[30rem]">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.34em]" style={{ color: "#C4B5FD" }}>
          Inner Pause
        </p>
        <div className="mx-auto mt-7 grid w-[min(62vw,15rem)] place-items-center">
          <div className="welcome-breathe">
            <HarmonyFormVisual playing dark className="w-full" />
          </div>
        </div>
        <h1 className="mt-8 text-[2.15rem] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.6rem]">
          Pause the noise.
          <br />
          Return to you.
        </h1>
        <p className="mx-auto mt-4 max-w-[24rem] text-[1.02rem] leading-7" style={{ color: "var(--ds-on-navy-muted)" }}>
          Short guided Pauses of sound and breath that steady you in about three minutes, whenever the day gets loud.
        </p>
        <div className="mt-8 grid justify-items-center gap-3">
          <Link
            href={installHref}
            onClick={() => haptic("tap")}
            className="ds-tap inline-flex min-h-[3.25rem] items-center justify-center rounded-full px-8 text-[1rem] font-semibold"
            style={{ background: "#C4B5FD", color: "#1D1B4C", boxShadow: "0 12px 32px rgba(196,181,253,0.28)" }}
          >
            Try {TRIAL_PAUSES} Pauses free
          </Link>
          <a href="#breathe" className="ds-tap inline-flex min-h-11 items-center gap-1 text-[0.92rem] font-medium" style={{ color: "var(--ds-on-navy-muted)" }}>
            Feel it first
            <IconChevronDown className="h-4 w-4" />
          </a>
        </div>
        <p className="mt-6 text-[0.8rem]" style={{ color: "var(--ds-on-navy-muted)" }}>
          Then <s>{rupees(PASS_LIST_PRICE_INR)}</s> <span className="font-semibold" style={{ color: "var(--ds-on-navy)" }}>{rupees(PASS_PRICE_INR)}</span> a year · never renews by itself
        </p>
      </div>
    </header>
  );
}

// One breath with us, right here: 4 in, 6 out, three times.
function BreathDemo() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 150);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const total = DEMO_BREATHS * (BREATH_IN_SECONDS + BREATH_OUT_SECONDS);
  const elapsed = startedAt === null ? 0 : Math.max(0, (now - startedAt) / 1000);
  const running = startedAt !== null && elapsed < total;
  const done = startedAt !== null && elapsed >= total;
  const count = running ? breathCountAt(elapsed) : null;

  const start = () => {
    haptic("moment");
    const at = Date.now();
    setStartedAt(at);
    setNow(at);
  };

  return (
    <section id="breathe" aria-labelledby="breathe-title" className="scroll-mt-6 text-center">
      <p className="ds-label uppercase" style={{ color: "var(--ds-accent)" }}>
        Try it now
      </p>
      <h2 id="breathe-title" className="ds-display mt-2 text-[1.75rem] leading-tight">
        Take three breaths with us
      </h2>
      <p className="mx-auto mt-2 max-w-[22rem] text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
        In for four, out for six. The same rhythm the app uses when you want to count.
      </p>

      <div className="relative mx-auto mt-8 grid h-[15rem] w-[15rem] place-items-center">
        <span
          className="welcome-breath-ring absolute inset-0 rounded-full"
          style={{
            transform: `scale(${count?.phase === "in" ? 1 : count ? 0.62 : 0.8})`,
            transitionDuration: `${count?.phase === "in" ? BREATH_IN_SECONDS : count ? BREATH_OUT_SECONDS : 1.2}s`,
          }}
          aria-hidden="true"
        />
        <span className="absolute inset-[22%] rounded-full" style={{ background: "var(--ds-surface)", boxShadow: "var(--ds-elevation-1)" }} aria-hidden="true" />
        <div className="relative grid justify-items-center" aria-live="polite">
          {count ? (
            <>
              <span className="text-[1.05rem] font-semibold">{count.phase === "in" ? "Breathe in" : "Breathe out"}</span>
              <span className="ds-num text-[2.6rem] font-semibold leading-tight" style={{ color: "var(--ds-accent)" }}>
                {count.count}
              </span>
              <span className="ds-caption">Breath {count.breath} of {DEMO_BREATHS}</span>
            </>
          ) : done ? (
            <span className="max-w-[9rem] text-[0.98rem] font-semibold leading-6">That&rsquo;s a Pause, in miniature.</span>
          ) : (
            <button type="button" onClick={start} className="ds-tap grid min-h-[4.5rem] min-w-[7rem] place-items-center rounded-full text-[1.05rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
              <span className="grid justify-items-center gap-0.5">
                Begin
                <span className="text-[0.76rem] font-medium" style={{ color: "var(--ds-text-muted)" }}>30 seconds</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {done ? (
        <p className="ds-settle mx-auto mt-6 max-w-[22rem] text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
          A full Pause adds sound tuned to how you feel, and a few gentle words.{" "}
          <button type="button" onClick={start} className="ds-tap font-semibold underline underline-offset-4" style={{ color: "var(--ds-accent)" }}>
            Again
          </button>
        </p>
      ) : null}
    </section>
  );
}

// Pick how you feel and see the Pause the app would make: the same planner
// the app uses (planFeelingStops), so what's shown here is what plays there.
function FeelingPicker({ installHref }: { installHref: string }) {
  const [picked, setPicked] = useState<string[]>(["Overthinking"]);
  const stops = useMemo(() => planFeelingStops(picked, PAUSE_SECONDS), [picked]);

  const toggle = (feeling: string) => {
    haptic("tap");
    setPicked((current) =>
      current.includes(feeling) ? current.filter((item) => item !== feeling) : current.length >= MAX_TELL_EMOTIONS ? current : [...current, feeling],
    );
  };

  return (
    <Section eyebrow="Made for how you feel" title="How are you, right now?">
      <p className="-mt-1 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
        Choose up to {MAX_TELL_EMOTIONS}. Inner Pause shapes a Pause around them.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Feelings">
        {FEELINGS.map((feeling) => {
          const on = picked.includes(feeling);
          return (
            <button
              key={feeling}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(feeling)}
              className="ds-tap inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[0.9rem] font-medium transition-colors"
              style={on ? { background: "var(--ds-accent)", color: "var(--ds-accent-on)" } : { background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "inset 0 0 0 1px var(--ds-border)" }}
            >
              {on ? <IconCheck className="h-3.5 w-3.5" /> : null}
              {feeling}
            </button>
          );
        })}
      </div>

      <div className="ds-card mt-1 overflow-hidden" aria-live="polite">
        {stops.length === 0 ? (
          <p className="px-5 py-6 text-center text-[0.92rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Pick a feeling to see your Pause.
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between px-5 pt-5">
              <p className="ds-h3">Your Pause</p>
              <p className="ds-num text-[0.85rem]" style={{ color: "var(--ds-text-muted)" }}>
                {PAUSE_SECONDS / 60} min
              </p>
            </div>
            <ol className="space-y-3 px-5 pb-5 pt-3">
              {stops.map((stop) => {
                const centre = CENTRE[stop.chakraId];
                return (
                  <li key={stop.chakraId} className="ds-settle flex gap-3.5">
                    <span
                      className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ background: centre?.color, boxShadow: `0 0 14px 3px color-mix(in srgb, ${centre?.color} 45%, transparent)` }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span className="font-semibold">
                          {centre?.name} <span className="ds-num font-normal" style={{ color: "var(--ds-text-muted)" }}>{stop.hz} Hz</span>
                        </span>
                        <span className="ds-num text-[0.8rem]" style={{ color: "var(--ds-text-muted)" }}>
                          {minutes(stop.seconds)}
                        </span>
                      </span>
                      <span className="block text-[0.86rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                        For {stop.feelings.join(" and ").toLowerCase()} · {centre?.theme.toLowerCase()}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <Link href={installHref} onClick={() => haptic("tap")} className="ds-tap flex min-h-12 items-center justify-center gap-1.5 border-t text-[0.95rem] font-semibold" style={{ borderColor: "var(--ds-border)", color: "var(--ds-accent)" }}>
              Play this Pause free
            </Link>
          </>
        )}
      </div>
    </Section>
  );
}

// The seven centres as one band of colour: tap one to read about it.
function CentresBand() {
  const centres = [...CHAKRA_GUIDE].reverse();
  const [active, setActive] = useState(centres[3].id);
  const current = centres.find((centre) => centre.id === active) ?? centres[0];

  return (
    <Section eyebrow="The sound" title="Seven centres, seven frequencies">
      <p className="-mt-1 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
        Every Pause is tuned to the frequency traditionally linked with one energy centre. The app always shows which one is playing.
      </p>
      <div
        className="relative mt-2 rounded-full p-1.5"
        style={{ background: `linear-gradient(90deg, ${centres.map((centre) => centre.color).join(", ")})` }}
        role="group"
        aria-label="The seven energy centres"
      >
        <div className="grid grid-cols-7">
          {centres.map((centre) => {
            const on = centre.id === active;
            return (
              <button
                key={centre.id}
                type="button"
                aria-pressed={on}
                aria-label={`${centre.name}, ${centre.frequencyHz} Hz`}
                onClick={() => {
                  haptic("tap");
                  setActive(centre.id);
                }}
                className="ds-tap grid min-h-11 place-items-center rounded-full"
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{ width: on ? 22 : 10, height: on ? 22 : 10, background: on ? "#fff" : "rgba(255,255,255,0.7)", boxShadow: on ? "0 2px 10px rgba(0,0,0,0.25)" : undefined }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div key={current.id} className="ds-card ds-settle px-5 py-4">
        <p className="flex items-baseline justify-between gap-2">
          <span className="ds-h3 inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: current.color, boxShadow: `0 0 10px 2px color-mix(in srgb, ${current.color} 45%, transparent)` }} aria-hidden="true" />
            {current.name}
          </span>
          <span className="ds-num text-[0.95rem] font-semibold">{current.frequencyHz} Hz</span>
        </p>
        <p className="mt-0.5 text-[0.92rem] font-medium">{current.theme}</p>
        <p className="mt-1.5 text-[0.88rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
          {current.about}
        </p>
      </div>
    </Section>
  );
}

function Pricing({ installHref }: { installHref: string }) {
  const includes = ["Every Pause, any time", "All five Practice paths", "Every sound and frequency", "Your journal and story, private"];
  return (
    <Section eyebrow="Simple pricing" title="Try it, then decide">
      <div className="relative overflow-hidden rounded-[var(--ds-radius-lg)] px-6 py-7" style={{ background: "linear-gradient(160deg, #2b2766 0%, #1d1b4c 100%)", color: "var(--ds-on-navy)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.85rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "#C4B5FD" }}>
            Inner Pause Pass
          </p>
          <span className="rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-wide" style={{ background: "#E0A868", color: "#1D1B4C" }}>
            Launch offer · 50% off
          </span>
        </div>
        <p className="mt-4 flex items-baseline gap-2.5">
          <s className="text-[1.1rem]" style={{ color: "var(--ds-on-navy-muted)" }}>
            {rupees(PASS_LIST_PRICE_INR)}
          </s>
          <span className="ds-num text-[2.6rem] font-semibold leading-none">{rupees(PASS_PRICE_INR)}</span>
          <span style={{ color: "var(--ds-on-navy-muted)" }}>a year</span>
        </p>
        <p className="mt-1 text-[0.88rem]" style={{ color: "var(--ds-on-navy-muted)" }}>
          About {rupees(Math.round(PASS_PRICE_INR / 12))} a month. Paid once, never renews by itself.
        </p>
        <ul className="mt-5 space-y-2">
          {includes.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-[0.95rem]">
              <IconCheck className="h-4 w-4 shrink-0" style={{ color: "#C4B5FD" }} />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href={installHref}
          onClick={() => haptic("tap")}
          className="ds-tap mt-7 flex min-h-[3.25rem] items-center justify-center rounded-full text-[1rem] font-semibold"
          style={{ background: "#C4B5FD", color: "#1D1B4C" }}
        >
          Start with {TRIAL_PAUSES} free Pauses
        </Link>
      </div>
    </Section>
  );
}

function FinalCall({ installHref }: { installHref: string }) {
  return (
    <section className="relative overflow-hidden px-4 py-16 text-center" style={{ background: "radial-gradient(90% 80% at 50% 100%, #3b3590 0%, #1d1b4c 70%)", color: "var(--ds-on-navy)" }}>
      <span className="welcome-orb welcome-orb--b" aria-hidden="true" />
      <div className="relative mx-auto max-w-[26rem]">
        <h2 className="text-[1.8rem] font-semibold leading-tight tracking-[-0.01em]">Your next three minutes could feel different.</h2>
        <p className="mt-3 text-[0.98rem] leading-7" style={{ color: "var(--ds-on-navy-muted)" }}>
          Install Inner Pause on your phone. Your first {TRIAL_PAUSES} Pauses are on us.
        </p>
        <Link
          href={installHref}
          onClick={() => haptic("tap")}
          className="ds-tap mt-7 inline-flex min-h-[3.25rem] items-center justify-center rounded-full px-8 text-[1rem] font-semibold"
          style={{ background: "#C4B5FD", color: "#1D1B4C" }}
        >
          Get Inner Pause
        </Link>
        <p className="mt-6 text-[0.78rem] leading-5" style={{ color: "var(--ds-on-navy-muted)" }}>
          Inner Pause supports everyday wellbeing. It is not a substitute for medical or mental health care.
        </p>
      </div>
    </section>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  const id = `welcome-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div>
        <p className="ds-label uppercase" style={{ color: "var(--ds-accent)" }}>
          {eyebrow}
        </p>
        <h2 id={id} className="ds-display mt-2 text-[1.75rem] leading-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="ds-tap flex min-h-14 w-full items-center justify-between gap-3 text-left text-[0.98rem] font-semibold"
      >
        {question}
        <IconChevronDown className="h-4 w-4 shrink-0 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : undefined, color: "var(--ds-text-muted)" }} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="pb-4 text-[0.92rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/** "3 min", "2½ min": a stop's share of the Pause, so the parts add up. */
function minutes(seconds: number) {
  const value = seconds / 60;
  if (Number.isInteger(value)) return `${value} min`;
  const whole = Math.floor(value);
  return Math.abs(value - whole - 0.5) < 0.01 ? `${whole || ""}½ min` : `${Math.round(value)} min`;
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <rect x="7" y="5.5" width="3.4" height="13" rx="1.7" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.7" />
    </svg>
  );
}

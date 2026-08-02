"use client";

import Link from "next/link";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";

const free = ["Limited journal analyses", "Limited personalised sessions", "Basic journal history", "Basic emotional check-in", "Introductory chakra sessions"];
const premium = ["Unlimited journal analysis", "Unlimited personalised healing journeys", "Deeper insights", "Longer sessions", "Full journal history", "WhatsApp morning guidance", "Saved personalised sessions", "Premium audio styles", "Offline audio", "Detailed progress patterns"];

export function PremiumScreen() {
  return (
    <MvpShell>
      <div className="space-y-5">
        <SectionTitle title="Premium Healing" copy="Shown after a useful free journal-to-session flow. Billing is abstracted and mocked until Stripe or app-store credentials are configured." />
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard title="Free" price="$0" items={free} action="Continue Free" />
          <PlanCard title="Premium" price="$9/mo" items={premium} action="Start Mock Upgrade" premium />
        </div>
        <GlassCard className="p-5">
          <h2 className="font-serif text-2xl text-[var(--gold-light)]">Billing providers</h2>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            Provider abstraction supports Stripe, Apple in-app purchase and Google Play billing. This build uses a mock provider until credentials are supplied.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Monthly", "Annual", "Lifetime launch", "Restore purchase", "Manage subscription"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-stone-300">{item}</span>
            ))}
          </div>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

function PlanCard({ title, price, items, action, premium: isPremium = false }: { title: string; price: string; items: string[]; action: string; premium?: boolean }) {
  return (
    <GlassCard className={`p-5 ${isPremium ? "border-[var(--gold-border)]" : ""}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-muted)]">{title}</p>
      <p className="mt-3 font-serif text-4xl text-[var(--gold-light)]">{price}</p>
      <ul className="mt-5 space-y-2 text-sm leading-6 text-stone-300">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
      {isPremium ? (
        <GoldButton className="mt-5 w-full" onClick={() => window.alert("Mock billing provider: connect Stripe, Apple or Google billing credentials for production.")}>{action}</GoldButton>
      ) : (
        <Link href="/" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--gold-border-soft)] text-[var(--gold-light)]">{action}</Link>
      )}
    </GlassCard>
  );
}

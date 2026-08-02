import Link from "next/link";

import { GlassCard, MvpShell, SectionTitle } from "@/components/mvp-shell";

export function PremiumScreen() {
  return (
    <MvpShell>
      <div className="space-y-3.5">
        <SectionTitle title="All features are included" copy="Paid restrictions are disabled during this testing phase." />
        <GlassCard className="p-4">
          <p className="text-sm leading-5 text-stone-300">
            Healing sessions, journal insights, history, audio styles and mock guidance are currently available to every user.
          </p>
          <Link href="/" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--gold-border-soft)] text-[var(--gold-light)]">Return Home</Link>
        </GlassCard>
      </div>
    </MvpShell>
  );
}

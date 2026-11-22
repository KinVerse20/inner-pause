"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PublicCard } from "@inner-pause/shared";

import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { Stagger, StaggerItem } from "@/components/reveal";
import { CHAKRA_GUIDE, CHAKRA_INTRO, CHAKRA_NOTE, findChakra, type ChakraGuideEntry } from "@/lib/chakra-guide";
import { getVisibleCards, subscribeAppContent } from "@/lib/content-store";
import { haptic } from "@/lib/haptics";
import { composeCardPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";

// "The seven energy centres" — Kinverse's chakra guide in our design.
// A reading space for the curious: reachable from Help & About and from
// "Why this Pause?", never in the way of starting a Pause.

const backStyle = { background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" };

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="ds-icon-btn" style={backStyle} onClick={() => haptic("tap")}>
      <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
    </Link>
  );
}

export function ChakraGuideScreen() {
  return (
    <PauseShell>
      <Stagger className="space-y-6 pb-4 pt-2">
        <StaggerItem>
          <BackLink href="/profile/help" label="Back to Help and About" />
        </StaggerItem>
        <StaggerItem>
          <header>
            <p className="ds-label uppercase" style={{ color: "var(--ds-text-muted)" }}>
              Sound and traditions
            </p>
            <h1 className="ds-display mt-2 text-[1.85rem]">The seven energy centres</h1>
            <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              {CHAKRA_INTRO}
            </p>
          </header>
        </StaggerItem>
        <StaggerItem>
          <ol className="ds-card divide-y overflow-hidden">
            {CHAKRA_GUIDE.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/chakras/${entry.id}`}
                  onClick={() => haptic("tap")}
                  className="ds-tap flex min-h-[4.5rem] items-center gap-3.5 px-4 py-3"
                >
                  <ChakraDot entry={entry} />
                  <span className="min-w-0 flex-1">
                    <span className="ds-h3 block">{entry.name}</span>
                    <span className="block text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
                      {entry.theme}
                    </span>
                  </span>
                  <span className="ds-caption ds-num shrink-0">{entry.frequencyHz} Hz</span>
                  <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} />
                </Link>
              </li>
            ))}
          </ol>
        </StaggerItem>
        <StaggerItem>
          <p className="ds-caption px-1 leading-5">{CHAKRA_NOTE}</p>
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

export function ChakraDetailScreen({ chakraId }: { chakraId: string }) {
  const router = useRouter();
  const entry = findChakra(chakraId);
  const [card, setCard] = useState<PublicCard | undefined>(undefined);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const load = () => setCard(getVisibleCards().find((item) => item.chakraId === chakraId));
    load();
    return subscribeAppContent(load);
  }, [chakraId]);

  if (!entry) return null;

  const start = () => {
    if (!card || starting) return;
    haptic("moment");
    setStarting(true);
    const record = createPauseRecord(composeCardPause(card));
    router.push(`/pause/player?session=${record.id}`);
  };

  return (
    <PauseShell>
      <div className="ds-settle space-y-6 pb-4 pt-2">
        <BackLink href="/chakras" label="All seven energy centres" />

        <section
          className="relative overflow-hidden rounded-[var(--ds-radius-lg)] px-5 pb-6 pt-7 text-center"
          style={{
            background: `radial-gradient(90% 80% at 50% 0%, color-mix(in srgb, ${entry.color} 26%, transparent) 0%, transparent 70%), var(--ds-surface)`,
            boxShadow: "var(--ds-elevation-1)",
          }}
        >
          <span className="relative mx-auto grid h-20 w-20 place-items-center" aria-hidden="true">
            <span className="ds-breathe absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${entry.color} 45%, transparent), transparent 70%)` }} />
            <span className="relative h-5 w-5 rounded-full" style={{ background: entry.color, boxShadow: `0 0 18px 4px color-mix(in srgb, ${entry.color} 50%, transparent)` }} />
          </span>
          <h1 className="ds-display mt-4 text-[1.85rem]">{entry.name}</h1>
          <p className="mt-1 text-[0.95rem]" style={{ color: "var(--ds-text-secondary)" }}>
            {entry.theme}
          </p>
          <span className="ds-num mt-4 inline-flex rounded-full px-3 py-1.5 text-sm" style={{ background: `color-mix(in srgb, ${entry.color} 16%, var(--ds-surface))` }}>
            {entry.frequencyHz} Hz
          </span>
        </section>

        <div className="space-y-3">
          <InfoCard title="What it's about" body={entry.about} color={entry.color} />
          <InfoCard title="When it feels off" body={entry.off} color={entry.color} />
          <InfoCard title="How your Pause uses it" body={entry.pause} color={entry.color} />
        </div>

        {card ? (
          <button type="button" onClick={start} disabled={starting} className="ds-filled w-full">
            {starting ? "Starting your Pause" : `Start a ${card.label} Pause`}
          </button>
        ) : null}

        <p className="ds-caption px-1 leading-5">{CHAKRA_NOTE}</p>
      </div>
    </PauseShell>
  );
}

function ChakraDot({ entry }: { entry: ChakraGuideEntry }) {
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
      style={{ background: `color-mix(in srgb, ${entry.color} 15%, var(--ds-surface))` }}
      aria-hidden="true"
    >
      <span className="h-3 w-3 rounded-full" style={{ background: entry.color }} />
    </span>
  );
}

function InfoCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <section className="ds-card px-5 py-4">
      <h2 className="ds-label flex items-center gap-2 uppercase" style={{ color: "var(--ds-text-muted)" }}>
        <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
        {title}
      </h2>
      <p className="mt-1.5 text-[0.98rem] leading-7">{body}</p>
    </section>
  );
}

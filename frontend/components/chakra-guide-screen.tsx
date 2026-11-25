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
  // Opened from "Why this Pause?" in the player: back goes back to the Pause.
  const [fromPause, setFromPause] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFromPause(new URLSearchParams(window.location.search).get("from") === "pause");
  }, []);

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
        {fromPause ? (
          <button type="button" onClick={() => router.back()} className="ds-tap inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 text-sm font-semibold" style={{ color: "var(--ds-accent)" }}>
            <IconChevronRight className="h-4 w-4" style={{ transform: "scaleX(-1)" }} />
            Back to your Pause
          </button>
        ) : (
          <BackLink href="/chakras" label="All seven energy centres" />
        )}

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

        <SoundLayers entry={entry} />

        {/* Not while a Pause is already playing (opened from it). */}
        {card && !fromPause ? (
          <button type="button" onClick={start} disabled={starting} className="ds-filled w-full">
            {starting ? "Starting your Pause" : `Start a ${card.label} Pause`}
          </button>
        ) : null}

        <CentresSpine currentId={entry.id} fromPause={fromPause} />

        <p className="ds-caption px-1 leading-5">{CHAKRA_NOTE}</p>
      </div>
    </PauseShell>
  );
}

// How a Pause is made, drawn as three layers: the sound you chose, this
// centre's tone quietly beneath it, and your breath slowing it all down.
function SoundLayers({ entry }: { entry: ChakraGuideEntry }) {
  const layers = [
    { title: "The sound you choose", body: "Rain, forest, piano. Something easy to rest your attention on.", path: "M0 14 C8 4 14 24 22 14 S36 4 44 14 S58 24 66 14 S80 4 88 14 S102 24 110 14 S124 4 132 14", width: 2.2, color: "var(--ds-text-muted)" },
    { title: `A quiet ${entry.frequencyHz} Hz tone beneath it`, body: "This centre's frequency, held softly under the sound. You can make it softer, clearer, or turn it off.", path: "M0 14 C4 11 8 11 12 14 S20 17 24 14 S32 11 36 14 S44 17 48 14 S56 11 60 14 S68 17 72 14 S80 11 84 14 S92 17 96 14 S104 11 108 14 S116 17 120 14 S128 11 132 14", width: 1.6, color: entry.color },
    { title: "Your breath, slowing down", body: "A longer breath out tells your body it's safe to settle. This part is well studied.", path: "M0 20 C22 20 22 8 44 8 S66 20 88 20 S110 8 132 8", width: 2.6, color: "var(--ds-accent)" },
  ];
  return (
    <section aria-labelledby="layers-title" className="ds-card px-5 py-5">
      <h2 id="layers-title" className="ds-h3">How the sound works</h2>
      <ol className="mt-4 space-y-4">
        {layers.map((layer) => (
          <li key={layer.title} className="grid grid-cols-[4.5rem_1fr] items-center gap-3.5">
            <svg viewBox="0 0 132 28" className="h-7 w-full" aria-hidden="true">
              <path d={layer.path} fill="none" stroke={layer.color} strokeWidth={layer.width} strokeLinecap="round" />
            </svg>
            <span>
              <span className="block text-[0.92rem] font-semibold">{layer.title}</span>
              <span className="block text-[0.85rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                {layer.body}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="ds-caption mt-4 leading-5">
        Frequencies come from traditional practice, and the research on them is still young. We offer them as something gentle to try, not a promise.
      </p>
    </section>
  );
}

// The seven centres from crown to root, as a spine: where this one sits,
// and a way to read about the others.
function CentresSpine({ currentId, fromPause }: { currentId: string; fromPause: boolean }) {
  return (
    <section aria-labelledby="spine-title" className="ds-card px-5 py-5">
      <h2 id="spine-title" className="ds-h3">All seven centres</h2>
      <ol className="relative mt-3">
        <span className="absolute bottom-5 left-[1.375rem] top-5 w-px" style={{ background: "var(--ds-border)" }} aria-hidden="true" />
        {CHAKRA_GUIDE.map((item) => {
          const current = item.id === currentId;
          return (
            <li key={item.id}>
              <Link
                href={`/chakras/${item.id}${fromPause ? "?from=pause" : ""}`}
                replace={fromPause}
                aria-current={current ? "page" : undefined}
                onClick={() => haptic("tap")}
                className="ds-tap relative flex min-h-11 items-center gap-3 rounded-[var(--ds-radius-md)] px-2 py-1.5"
                style={current ? { background: `color-mix(in srgb, ${item.color} 12%, transparent)` } : undefined}
              >
                <span className="grid w-7 place-items-center" aria-hidden="true">
                  <span
                    className={`rounded-full ${current ? "ds-breathe" : ""}`}
                    style={{ width: current ? 16 : 11, height: current ? 16 : 11, background: item.color, boxShadow: current ? `0 0 12px 3px color-mix(in srgb, ${item.color} 45%, transparent)` : undefined }}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[0.92rem] ${current ? "font-semibold" : "font-medium"}`}>{item.name}</span>
                  <span className="block truncate text-[0.78rem]" style={{ color: "var(--ds-text-secondary)" }}>
                    {item.theme}
                  </span>
                </span>
                <span className="ds-caption ds-num shrink-0">{item.frequencyHz} Hz</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
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

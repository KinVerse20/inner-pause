"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PublicCard } from "@inner-pause/shared";

import { LandscapeScene } from "@/components/landscape-scene";
import { IconChevronRight } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { Stagger, StaggerItem } from "@/components/reveal";
import { getCard, subscribeAppContent } from "@/lib/content-store";
import { composeCardPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";

// A Right Now card's own screen (Home → Calm, or any admin-created card):
// the sound environments an admin added to it (/admin → Cards), shown as
// cards. Picking one
// starts the Pause with that sound, tuned to the card's frequency. Home only
// routes here when the card has at least one sound; with none, the tile
// still starts a Pause directly.
export function CategorySoundsScreen({ cardId }: { cardId: string }) {
  const router = useRouter();
  // undefined: not read yet; null: no such card (deleted, or a stale link).
  const [card, setCard] = useState<PublicCard | null | undefined>(undefined);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    const load = () => setCard(getCard(cardId) ?? null);
    load();
    return subscribeAppContent(load);
  }, [cardId]);

  if (card === undefined) return <PauseShell>{null}</PauseShell>;
  if (card === null) {
    return (
      <PauseShell>
        <div className="space-y-4 pt-8 text-center">
          <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
            This Pause isn&rsquo;t available any more.
          </p>
          <Link href="/" className="ds-filled ds-tap inline-flex">
            Back to Home
          </Link>
        </div>
      </PauseShell>
    );
  }

  const category = card;
  const sounds = card.sounds;

  const start = (soundId: string | null) => {
    if (startingId) return;
    setStartingId(soundId ?? "none");
    const record = createPauseRecord(composeCardPause(card, { ambientSoundId: soundId }));
    router.push(`/pause/player?session=${record.id}`);
  };

  return (
    <PauseShell>
      <Stagger className="space-y-6 pb-4 pt-2">
        <StaggerItem>
          <header>
            <Link
              href="/"
              className="ds-tap -my-3.5 inline-flex min-h-11 items-center gap-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ color: "var(--ds-text-secondary)" }}
            >
              <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
              Home
            </Link>
            <h1 className="mt-2 ds-display text-[1.85rem]">{category.label}</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ds-text-secondary)" }}>
              {category.tagline}. Choose a sound to begin.
            </p>
          </header>
        </StaggerItem>

        <StaggerItem>
          {sounds.length === 0 ? (
            <div className="ds-card space-y-3 px-5 py-6 text-center">
              <p className="text-sm" style={{ color: "var(--ds-text-secondary)" }}>
                No sounds have been added to {category.label} yet.
              </p>
              <button type="button" onClick={() => start(null)} disabled={startingId !== null} className="ds-filled ds-tap">
                Start Pause
              </button>
            </div>
          ) : (
            <section aria-label={`${category.label} sounds`} className="grid grid-cols-2 gap-3">
              {sounds.map((sound) => (
                <button
                  key={sound.soundId}
                  type="button"
                  onClick={() => start(sound.soundId)}
                  disabled={startingId !== null}
                  className="ds-card ds-card-lift ds-tap overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    {sound.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image served by the backend, not a build-time asset
                      <img src={sound.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <LandscapeScene variant="day" className="absolute inset-0 h-full w-full scale-110" />
                    )}
                  </span>
                  <span className="block px-3.5 py-3">
                    <span className="block text-[0.95rem] font-semibold leading-snug">
                      {startingId === sound.soundId ? "Preparing…" : sound.name}
                    </span>
                    {sound.description ? (
                      <span className="mt-0.5 block text-[0.75rem] leading-snug" style={{ color: "var(--ds-text-secondary)" }}>
                        {sound.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))}
            </section>
          )}
        </StaggerItem>

        {sounds.length > 0 ? (
          <StaggerItem>
            <button
              type="button"
              onClick={() => start(null)}
              disabled={startingId !== null}
              className="ds-tap block min-h-11 w-full text-center text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:opacity-60"
              style={{ color: "var(--ds-text-secondary)" }}
            >
              Start without a sound
            </button>
          </StaggerItem>
        ) : null}
      </Stagger>
    </PauseShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DEFAULT_CARDS, type PublicCard } from "@inner-pause/shared";

import { CardIcon } from "@/components/card-icon";
import { LandscapeScene } from "@/components/landscape-scene";
import { IconMic, IconPencil, IconSun } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { Stagger, StaggerItem } from "@/components/reveal";
import { getVisibleCards, subscribeAppContent } from "@/lib/content-store";
import { composeCardPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";

// The server render (and the first client paint) use the six shipped cards
// so hydration matches; the admin-managed list from the content store is
// swapped in right after mount.
const INITIAL_CARDS: PublicCard[] = DEFAULT_CARDS.map((card) => ({ ...card, sounds: [] }));

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function PauseHomeScreen() {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Hello");
  const [cards, setCards] = useState<PublicCard[]>(INITIAL_CARDS);

  useEffect(() => {
    // Local clock only — reading during render hydrates against the server's hour.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(greetingForHour(new Date().getHours()));
    const load = () => setCards(getVisibleCards());
    load();
    return subscribeAppContent(load);
  }, []);

  const handleRightNow = (card: PublicCard) => {
    if (startingId) return;
    setStartingId(card.id);
    // A card with admin-added sounds opens its own screen so the user can
    // pick River, Rain…; a card without any still starts at once.
    if (card.sounds.length > 0) {
      router.push(`/pause/${card.id}`);
      return;
    }
    const record = createPauseRecord(composeCardPause(card));
    router.push(`/pause/player?session=${record.id}`);
  };

  return (
    <PauseShell>
      <Stagger className="space-y-6 pb-4 pt-1">
        <StaggerItem>
          <header className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <IconSun className="h-5 w-5" style={{ color: "var(--ds-warning)" }} />
                <h1 className="ds-display text-[1.75rem] sm:text-[2rem]">{greeting}</h1>
              </div>
              <p className="mt-1 text-[0.92rem]" style={{ color: "var(--ds-text-secondary)" }}>
                Take a moment for you.
              </p>
            </div>
          </header>
        </StaggerItem>

        <StaggerItem>
          <section aria-label="What's on your mind?">
            <div className="ds-card ds-card-lift ds-tap overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                <LandscapeScene variant="day" className="absolute inset-0 h-full w-full scale-105" />
              </div>
              <div className="px-5 py-4">
                <h2 className="text-[1.15rem] font-semibold tracking-[-0.01em]">Start a Pause</h2>
                <p className="mt-1 text-sm leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                  A few minutes can change your day.
                </p>
                <div className="mt-4 flex gap-2.5">
                  <Link
                    href="/tell"
                    className="ds-filled ds-tap flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                  >
                    <IconPencil className="h-[1.05rem] w-[1.05rem]" />
                    Write
                  </Link>
                  <Link
                    href="/tell?mode=speak"
                    className="ds-outlined ds-tap flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2"
                  >
                    <IconMic className="h-[1.05rem] w-[1.05rem]" />
                    Speak
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section aria-label="What do you need right now?">
            <h2 className="text-[1.05rem] font-semibold tracking-[-0.01em]">What do you need right now?</h2>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {cards.map((card) => {
                const isStarting = startingId === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={startingId !== null}
                    onClick={() => handleRightNow(card)}
                    className="ds-card ds-card-lift ds-tap flex min-h-[6.1rem] flex-col items-center justify-center gap-1 px-1.5 py-3 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span
                      className="ds-outcome-icon grid h-10 w-10 place-items-center rounded-full"
                      style={{ ["--ds-outcome-color" as string]: `var(--ds-outcome-${card.tone})` }}
                    >
                      <CardIcon icon={card.icon} className="h-[1.1rem] w-[1.1rem]" />
                    </span>
                    <span className="mt-0.5 text-[0.8rem] font-semibold leading-tight">
                      {isStarting ? "Preparing…" : card.label}
                    </span>
                    {!isStarting && card.subtitle ? (
                      <span className="text-[0.75rem] leading-tight" style={{ color: "var(--ds-text-secondary)" }}>
                        {card.subtitle}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section aria-label="For what's happening in your life">
            <Link
              href="/moments"
              className="ds-card ds-card-lift ds-tap flex items-center justify-between gap-3 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
            >
              <div className="min-w-0 px-4 py-3.5">
                <p className="text-[0.88rem] font-semibold leading-snug">For the moments that matter</p>
                <p className="mt-0.5 text-[0.75rem] leading-snug" style={{ color: "var(--ds-text-secondary)" }}>
                  Before, during, and after what&rsquo;s on your mind
                </p>
              </div>
              <span className="relative h-[4.75rem] w-[6.5rem] shrink-0 overflow-hidden">
                <LandscapeScene variant="dawn" className="absolute inset-0 h-full w-full scale-110" />
              </span>
            </Link>
          </section>
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

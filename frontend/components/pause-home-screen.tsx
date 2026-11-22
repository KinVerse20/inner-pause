"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DEFAULT_CARDS, type PublicCard } from "@inner-pause/shared";

import { CardIcon } from "@/components/card-icon";
import { IconBubbles, IconCalendar, IconChevronRight, IconMic, IconPencil, IconYouTab } from "@/components/pause-icons";
import { PauseShell } from "@/components/pause-shell";
import { Stagger, StaggerItem } from "@/components/reveal";
import { haptic } from "@/lib/haptics";
import { getVisibleCards, subscribeAppContent } from "@/lib/content-store";
import { composeCardPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";

// The server render (and the first client paint) use the six shipped cards
// so hydration matches; the admin-managed list from the content store is
// swapped in right after mount.
const INITIAL_CARDS: PublicCard[] = DEFAULT_CARDS.map((card) => ({ ...card, sounds: [] }));

// Home (UX_ARCHITECTURE.md "Home"; founder-approved Home mockup).
// Hierarchy, top to bottom — one primary action, two quiet doorways:
//   1. Right Now outcome tiles (the primary action: feel better now)
//   2. "What's on your mind?" — Tell Inner Pause, by writing or speaking
//   3. Big Moments doorway
// No greeting hero, no illustration: the question is the headline.
export function PauseHomeScreen() {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [cards, setCards] = useState<PublicCard[]>(INITIAL_CARDS);

  useEffect(() => {
    const load = () => setCards(getVisibleCards());
    load();
    return subscribeAppContent(load);
  }, []);

  const handleRightNow = (card: PublicCard) => {
    if (startingId) return;
    haptic("tap");
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
      <Stagger className="space-y-7 pb-4 pt-2">
        <StaggerItem>
          <header className="flex items-start justify-between gap-4">
            <div className="min-w-0 pt-1">
              <h1 className="ds-display text-[1.85rem] sm:text-[2.1rem]">
                What do you need
                <br />
                right now?
              </h1>
              <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                Choose a Pause to shift how you feel.
              </p>
            </div>
            <Link
              href="/profile"
              aria-label="You"
              className="ds-icon-btn shrink-0"
              style={{ background: "var(--ds-surface)", color: "var(--ds-text)", boxShadow: "var(--ds-elevation-1)" }}
            >
              <IconYouTab className="h-5 w-5" />
            </Link>
          </header>
        </StaggerItem>

        <StaggerItem>
          <section aria-label="Pauses for right now" className="grid grid-cols-3 gap-2.5">
            {cards.map((card) => {
              const isStarting = startingId === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={startingId !== null && !isStarting}
                  aria-busy={isStarting || undefined}
                  onClick={() => handleRightNow(card)}
                  className="ds-card ds-card-lift ds-tap flex min-h-[7.6rem] flex-col items-center justify-center gap-1.5 px-1.5 py-3.5 text-center"
                  style={isStarting ? { borderColor: `var(--ds-outcome-${card.tone})` } : undefined}
                >
                  <span
                    className={`ds-outcome-icon grid h-12 w-12 place-items-center rounded-full ${isStarting ? "ds-breathe" : ""}`}
                    style={{ ["--ds-outcome-color" as string]: `var(--ds-outcome-${card.tone})` }}
                  >
                    <CardIcon icon={card.icon} className="h-[1.3rem] w-[1.3rem]" />
                  </span>
                  <span className="mt-1 text-[0.9rem] font-semibold leading-tight">{card.label}</span>
                  {card.subtitle ? (
                    <span className="text-[0.78rem] leading-tight" style={{ color: "var(--ds-text-secondary)" }}>
                      {isStarting ? "Starting" : card.subtitle}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </section>
        </StaggerItem>

        <StaggerItem>
          <section
            aria-labelledby="home-mind-title"
            className="rounded-[var(--ds-radius-lg)] px-5 py-5"
            style={{ background: "var(--ds-accent-soft)" }}
          >
            <div className="flex gap-3.5">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                style={{ background: "var(--ds-surface)", color: "var(--ds-accent-secondary)" }}
                aria-hidden="true"
              >
                <IconBubbles className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 id="home-mind-title" className="ds-h2">
                  What&rsquo;s on your mind?
                </h2>
                <p className="mt-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                  Say it or write it. We&rsquo;ll help you find the right Pause.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link href="/tell" className="ds-outlined" style={{ borderColor: "transparent" }} onClick={() => haptic("tap")}>
                <IconPencil className="h-[1.05rem] w-[1.05rem]" />
                Write
              </Link>
              <Link href="/tell?mode=speak" className="ds-outlined" style={{ borderColor: "transparent" }} onClick={() => haptic("tap")}>
                <IconMic className="h-[1.05rem] w-[1.05rem]" />
                Speak
              </Link>
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <Link
            href="/moments"
            className="ds-tap grid grid-cols-[auto_1fr] items-start gap-x-3.5 gap-y-2 rounded-[var(--ds-radius-lg)] px-1 py-2"
          >
            <span
              className="ds-outcome-icon row-span-2 grid h-11 w-11 place-items-center rounded-full"
              style={{ ["--ds-outcome-color" as string]: "var(--ds-outcome-focus)" }}
              aria-hidden="true"
            >
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="ds-h3 block">For the big moments in your life</span>
              <span className="mt-0.5 block text-[0.82rem] leading-5" style={{ color: "var(--ds-text-secondary)" }}>
                Before an interview · during a tough conversation · after an argument
              </span>
            </span>
            <span className="flex items-center gap-0.5 text-sm font-semibold" style={{ color: "var(--ds-warning)" }}>
              Explore
              <IconChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </StaggerItem>
      </Stagger>
    </PauseShell>
  );
}

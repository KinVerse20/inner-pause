"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";

import { IconHomeTab, IconJourneyTab, IconPracticeTab, IconYouTab } from "@/components/pause-icons";
import { composeGroundPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";

// New-design-system shell (docs/DESIGN_SYSTEM.md), scoped to screens rebuilt
// against it — currently Home and Moments. Other tabs keep rendering through
// MvpShell/MvpBottomNav until they're rebuilt in turn
// (docs/TECHNICAL_ARCHITECTURE.md §22's phased migration).
//
// Locked nav (docs/PRODUCT_FLOW.md §4): Home · Practice · Pause · Journey ·
// You — five icons, but the center Pause is an action, not a destination.
const destinations: Array<{ href: string; label: string; Icon: ComponentType<{ className?: string }> }> = [
  { href: "/", label: "Home", Icon: IconHomeTab },
  { href: "/practice", label: "Practice", Icon: IconPracticeTab },
  { href: "/journey", label: "Journey", Icon: IconJourneyTab },
  { href: "/profile", label: "You", Icon: IconYouTab },
];

export function PauseShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh overflow-x-hidden"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}
    >
      <main
        className="mx-auto min-h-dvh w-full max-w-[30rem] px-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 md:max-w-[40rem]"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <PauseBottomNav />
    </div>
  );
}

function PauseBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  // Center Pause action — the Ground Pause (docs/PRODUCT_FLOW.md §4/§7):
  // immediate, no question, no mode, no context, no Arrive. A distinct
  // PauseType, never the Right Now "Calm" outcome.
  const handlePause = () => {
    if (starting) return;
    setStarting(true);
    const record = createPauseRecord(composeGroundPause());
    router.push(`/pause/player?session=${record.id}`);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t" style={{ borderColor: "var(--ds-border)", background: "var(--ds-surface)" }}>
      <div className="mx-auto grid max-w-[30rem] grid-cols-5 items-end px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:max-w-[40rem]">
        {destinations.slice(0, 2).map((item) => (
          <NavDestination key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handlePause}
            disabled={starting}
            aria-label={starting ? "Preparing your Pause" : "Start a Pause"}
            className="ds-tap -mt-7 grid h-[3.75rem] w-[3.75rem] shrink-0 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ds-accent)] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ boxShadow: "var(--ds-shadow-raised)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, no benefit from next/image's raster pipeline */}
            <img src="/branding/innerpause-pause-action.svg" alt="" width={60} height={60} className="h-full w-full" />
          </button>
        </div>

        {destinations.slice(2).map((item) => (
          <NavDestination key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavDestination({
  item,
  active,
}: {
  item: { href: string; label: string; Icon: ComponentType<{ className?: string }> };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="ds-tap grid min-h-11 place-items-center gap-1 rounded-[var(--ds-radius-sm)] py-1.5 text-center text-[0.68rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
      style={{ color: active ? "var(--ds-accent)" : "var(--ds-text-secondary)" }}
    >
      <item.Icon className="h-5 w-5" />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

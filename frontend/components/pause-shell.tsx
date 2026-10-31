"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";

import { IconHomeTab, IconJourneyTab, IconPracticeTab, IconYouTab } from "@/components/pause-icons";
import { composeGroundPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";

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
        style={{ paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
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

  const handlePause = () => {
    if (starting) return;
    setStarting(true);
    const record = createPauseRecord(composeGroundPause());
    router.push(`/pause/player?session=${record.id}`);
  };

  return (
    <nav className="ds-nav fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto grid max-w-[30rem] grid-cols-5 items-end px-1 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 md:max-w-[40rem]">
        {destinations.slice(0, 2).map((item) => (
          <NavDestination key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handlePause}
            disabled={starting}
            aria-label={starting ? "Preparing your Pause" : "Start a Pause"}
            className="ds-fab-glow ds-tap -mt-8 grid h-[3.75rem] w-[3.75rem] shrink-0 place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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
      className="ds-tap relative grid min-h-11 place-items-center gap-0.5 rounded-[var(--ds-radius-sm)] py-1 text-center text-[0.75rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
      style={{ color: active ? "var(--ds-accent)" : "var(--ds-text-muted)" }}
    >
      <span
        className="ds-nav-indicator"
        style={active ? { background: "var(--ds-accent-soft)" } : undefined}
      >
        <item.Icon className="h-5 w-5" />
      </span>
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

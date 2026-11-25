"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, ViewTransition, type ComponentType, type ReactNode } from "react";

import { NavHomeIcon, NavMomentsIcon, NavPracticeIcon, NavYouIcon } from "@/components/nav-icons";
import { haptic } from "@/lib/haptics";
import { composeGroundPause } from "@/lib/pause-engine";
import { createPauseRecord } from "@/lib/pause-storage";
import { EXPAND, expandName, markPageTransition } from "@/lib/view-transition";

type TabIcon = ComponentType<{ active: boolean; className?: string }>;

// Moments has its own tab (letting out lives there). The last tab is You,
// where people expect it (Instagram, Headspace, Calm): your Journey diary,
// with settings behind its gear (/profile).
const destinations: Array<{ href: string; label: string; Icon: TabIcon }> = [
  { href: "/", label: "Home", Icon: NavHomeIcon },
  { href: "/moments", label: "Moments", Icon: NavMomentsIcon },
  { href: "/practice", label: "Practice", Icon: NavPracticeIcon },
  { href: "/journey", label: "You", Icon: NavYouIcon },
];

// Every tab opens onto a soft wash of brand color at the top (a glow, not
// a fill); Home gets the warmer "sunrise" version. Purely decorative.
export function PauseShell({ children, glow = "soft" }: { children: ReactNode; glow?: "soft" | "sunrise" }) {
  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}
    >
      <div className={`app-glow app-glow--${glow}`} aria-hidden="true" />
      <main
        className="relative mx-auto min-h-dvh w-full max-w-[30rem] px-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 md:max-w-[40rem]"
        style={{ paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Slides forward or back when a You row or back link says so
            (markPageTransition in lib/view-transition.ts). */}
        <div className="page-content">{children}</div>
      </main>
      <PauseBottomNav />
    </div>
  );
}

function PauseBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  // Have the player ready before anyone taps: it only grows out of a tile
  // or this button if it can render in the same moment (no loading step).
  useEffect(() => {
    router.prefetch("/pause/player");
  }, [router]);

  const handlePause = () => {
    if (starting) return;
    setStarting(true);
    haptic("moment");
    const record = createPauseRecord(composeGroundPause());
    markPageTransition("hold");
    router.push(`/pause/player?session=${record.id}&from=pause-action`, { transitionTypes: EXPAND });
  };

  // Named so the tab bar holds still while page content slides beneath it.
  return (
    <nav className="ds-nav fixed inset-x-0 bottom-0 z-40" style={{ viewTransitionName: "ip-bottom-nav" }}>
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
            className="ds-tap -mt-7 grid justify-items-center gap-1 rounded-[var(--ds-radius-md)] text-[0.75rem] font-medium"
            style={{ color: "var(--ds-text)" }}
          >
            <ViewTransition name={expandName("pause-action")} share="expand" default="none">
            <span
              className="grid h-[3.75rem] w-[3.75rem] place-items-center rounded-full transition-[filter] duration-[var(--ds-duration-base)]"
              style={{ boxShadow: "0 8px 20px rgba(29, 27, 76, 0.24)", filter: starting ? "brightness(0.92)" : undefined }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG, no benefit from next/image's raster pipeline */}
              <img src="/branding/innerpause-pause-action.svg" alt="" width={60} height={60} className="h-full w-full" />
            </span>
            </ViewTransition>
            <span aria-hidden="true">Pause</span>
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
  if (href === "/") return pathname === "/";
  // Settings live under You.
  if (href === "/journey") return pathname.startsWith("/journey") || pathname.startsWith("/profile");
  return pathname.startsWith(href);
}

// A tab: outline icon at rest, filled when it's where you are. Hover
// tints its pill (pointer devices), a press sinks it with a light tap, and
// the active pill glides between tabs (view-transition name "ip-nav-pill").
function NavDestination({ item, active }: { item: { href: string; label: string; Icon: TabIcon }; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        if (!active) haptic("tap");
      }}
      className="ds-nav-item relative grid min-h-12 place-items-center gap-0.5 rounded-[var(--ds-radius-sm)] py-1 text-center text-[0.75rem]"
      style={{ color: active ? "var(--ds-accent)" : "var(--ds-text-muted)" }}
    >
      <span
        className="ds-nav-indicator"
        style={active ? { background: "var(--ds-accent-soft)", viewTransitionName: "ip-nav-pill" } : undefined}
      >
        <item.Icon active={active} className="h-[1.4rem] w-[1.4rem]" />
      </span>
      <span className={active ? "font-semibold" : "font-medium"}>{item.label}</span>
    </Link>
  );
}

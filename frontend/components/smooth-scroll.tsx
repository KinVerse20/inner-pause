"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import "lenis/dist/lenis.css";

// Design system §10: ease-in-out only — no elastic overshoot.
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function RouteScrollReset() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.085,
        duration: 1.15,
        easing: easeInOutCubic,
        smoothWheel: true,
        syncTouch: true,
        syncTouchLerp: 0.08,
        touchInertiaExponent: 1.15,
        touchMultiplier: 1,
        wheelMultiplier: 0.92,
        allowNestedScroll: true,
        anchors: { duration: 0.9, easing: easeInOutCubic },
        respectReducedMotion: true,
        stopInertiaOnNavigate: true,
      }}
    >
      <RouteScrollReset />
      {children}
    </ReactLenis>
  );
}

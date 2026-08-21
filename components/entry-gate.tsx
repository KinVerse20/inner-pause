"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { readMvpState, subscribeMvpState } from "@/lib/mvp-storage";

// Replaces the old mandatory-questionnaire OnboardingGate (this slice's
// brief: "Landing/Entry -> Home -> first Pause," no mandatory step before
// first value). Same underlying flag (HealingProfile.onboardingCompleted)
// and the same hydration-safe mechanism as before — only the meaning and
// the redirect target changed: it now just means "has this device seen
// the one-time Entry screen," not "completed the 5-question wizard."
// Keeping the flag name/shape is deliberate: every existing Playwright
// regression suite seeds `onboardingCompleted: true` to bypass this gate,
// and there's no reason to break that compatibility for a rename.
//
// proxy.ts only knows about Supabase auth, not this flag — it lives in
// client-side mvp-storage — so this has to run here instead of in
// middleware. Exempt routes are the ones reachable while signed out
// (matches proxy.ts's publicRoutes) plus /entry itself, to avoid a
// redirect loop.
const exemptPaths = ["/entry", "/auth", "/about", "/offline"];

function isExempt(pathname: string) {
  return exemptPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function EntryGate() {
  const pathname = usePathname();
  const router = useRouter();

  // Deliberately NOT sourced from useMvpState()'s render-time snapshot.
  // useSyncExternalStore forces the first client commit to render using
  // getServerSnapshot (onboardingCompleted: false), and only corrects to the
  // real localStorage-backed value on a follow-up re-render. A redirect
  // fired off that first, placeholder-driven render sends already-entered
  // returning users to /entry on every cold load. Reading state inside an
  // effect instead sidesteps that: this component's rendered output (null)
  // never depends on the value, so there is nothing for React to reconcile
  // against a server snapshot, and by the time any effect runs,
  // window.localStorage already reflects the real, current state.
  const [hasEntered, setHasEntered] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setHasEntered(readMvpState().profile.onboardingCompleted);
    sync();
    return subscribeMvpState(sync);
  }, []);

  useEffect(() => {
    if (hasEntered === null) return; // real state not read yet — don't decide on a placeholder
    if (isExempt(pathname)) return;
    if (!hasEntered) router.replace("/entry");
  }, [pathname, router, hasEntered]);

  return null;
}

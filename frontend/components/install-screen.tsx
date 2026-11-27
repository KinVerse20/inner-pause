"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { PASS_LIST_PRICE_INR, PASS_PRICE_INR, TRIAL_PAUSES } from "@inner-pause/shared";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";
import { haptic } from "@/lib/haptics";
import {
  canPromptInstall,
  installPlatform,
  isStandalone,
  justInstalled,
  promptInstall,
  rememberSource,
  subscribeInstall,
  type InstallPlatform,
} from "@/lib/install-prompt";
import { upsertProfile } from "@/lib/mvp-storage";
import { rupees } from "@/lib/pass-summary";

// /install: where the ads send people (docs/COMMERCIAL_PLAN.md C5). One
// line about Inner Pause, the trial and the price, then the way to install
// it on this phone: a real Install button on Android, the Share steps on
// iPhone (Apple allows no button), and "open it on your phone" elsewhere.

const POINTS = ["A Pause of a few minutes, whenever you need one", "Help through big moments, before, during and after", "Five Practice paths that grow with you"];

export function InstallScreen() {
  const router = useRouter();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const canPrompt = useSyncExternalStore(subscribeInstall, canPromptInstall, () => false);
  const installed = useSyncExternalStore(subscribeInstall, justInstalled, () => false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    rememberSource(window.location.search);
    // Opened from the home screen already: straight into the app.
    if (isStandalone()) {
      upsertProfile({ onboardingCompleted: true });
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(installPlatform());
  }, [router]);

  const install = async () => {
    haptic("tap");
    setBusy(true);
    try {
      if (await promptInstall()) haptic("success");
    } finally {
      setBusy(false);
    }
  };

  const useInBrowser = () => {
    upsertProfile({ onboardingCompleted: true });
    router.push("/");
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden"
      style={{
        background: "radial-gradient(90% 45% at 50% 22%, var(--ds-accent-soft) 0%, var(--ds-bg) 70%)",
        color: "var(--ds-text)",
        fontFamily: "var(--ds-font-sans)",
      }}
    >
      <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
        <div className="ds-settle grid justify-items-center text-center">
          <HarmonyFormVisual playing className="ds-only-light w-[min(40vw,9.5rem)]" />
          <HarmonyFormVisual playing dark className="ds-only-dark w-[min(40vw,9.5rem)]" />
          <p className="mt-6 text-[1.05rem] font-semibold tracking-[0.34em]">INNER PAUSE</p>
          <h1 className="mt-3 text-[1.45rem] font-semibold leading-snug tracking-[-0.01em]">
            Pause the noise.
            <br />
            Return to you.
          </h1>
        </div>

        <ul className="ds-settle mt-7 space-y-2.5" style={{ animationDelay: "0.06s" }}>
          {POINTS.map((point) => (
            <li key={point} className="flex gap-3 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--ds-accent)" }} aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <section className="ds-settle ds-card mt-6 px-5 py-4 text-center" style={{ animationDelay: "0.1s" }} aria-label="Price">
          <p className="text-[0.95rem] font-semibold">Try {TRIAL_PAUSES} Pauses free</p>
          <p className="mt-1 text-[0.9rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Then{" "}
            {PASS_PRICE_INR < PASS_LIST_PRICE_INR ? (
              <s className="mr-1" style={{ color: "var(--ds-text-muted)" }}>
                {rupees(PASS_LIST_PRICE_INR)}
              </s>
            ) : null}
            <span className="font-semibold" style={{ color: "var(--ds-text)" }}>
              {rupees(PASS_PRICE_INR)}
            </span>{" "}
            a year{PASS_PRICE_INR < PASS_LIST_PRICE_INR ? ", launch offer" : ""}
          </p>
        </section>

        <div className="ds-settle mt-auto space-y-3 pt-8" style={{ animationDelay: "0.14s" }}>
          {installed ? (
            <div className="ds-card px-5 py-4 text-center" role="status">
              <p className="font-semibold">Installed</p>
              <p className="mt-1 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                Open Inner Pause from your home screen.
              </p>
            </div>
          ) : canPrompt ? (
            <button type="button" onClick={() => void install()} disabled={busy} className="ds-filled ds-tap w-full">
              {busy ? "Installing" : "Install the app"}
            </button>
          ) : platform === "ios" ? (
            <IosSteps />
          ) : platform === "android" ? (
            <div className="ds-card px-5 py-4 text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Open your browser&rsquo;s menu <span aria-hidden="true">⋮</span> and choose <strong style={{ color: "var(--ds-text)" }}>Install app</strong> or{" "}
              <strong style={{ color: "var(--ds-text)" }}>Add to Home screen</strong>.
            </div>
          ) : platform === "desktop" ? (
            <div className="ds-card px-5 py-4 text-center text-[0.9rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
              Inner Pause is made for your phone. Open this page on it to install.
            </div>
          ) : null}

          <button type="button" onClick={useInBrowser} className="ds-tap min-h-11 w-full rounded-full text-[0.9rem] font-semibold" style={{ color: "var(--ds-accent)" }}>
            {installed ? "Continue here instead" : "Use it in the browser"}
          </button>
          <p className="text-center text-[0.75rem]" style={{ color: "var(--ds-text-muted)" }}>
            <Link href="/terms" className="underline underline-offset-2">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/privacy-policy" className="underline underline-offset-2">
              Privacy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function IosSteps() {
  return (
    <ol className="ds-card space-y-3 px-5 py-4 text-[0.9rem] leading-6" aria-label="Add Inner Pause to your home screen">
      <li className="flex items-center gap-3">
        <StepNumber n={1} />
        <span>
          Tap <ShareIcon /> <strong>Share</strong> in Safari&rsquo;s toolbar
        </span>
      </li>
      <li className="flex items-center gap-3">
        <StepNumber n={2} />
        <span>
          Choose <strong>Add to Home Screen</strong>
        </span>
      </li>
      <li className="flex items-center gap-3">
        <StepNumber n={3} />
        <span>Open Inner Pause from your home screen</span>
      </li>
    </ol>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.8rem] font-semibold" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }} aria-hidden="true">
      {n}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mx-0.5 inline h-[1.15em] w-[1.15em] -translate-y-px align-middle" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--ds-accent)" }}>
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

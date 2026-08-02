"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "chakra-pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIos = () =>
  typeof window !== "undefined" && /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export function InstallPwaPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "true");
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      window.localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const showIosHint = useMemo(() => !installed && !installEvent && isIos(), [installed, installEvent]);
  const visible = !installed && !dismissed && (Boolean(installEvent) || showIosHint);

  if (!visible) return null;

  return (
    <div className="mb-5 rounded-[1.5rem] border border-amber-200/15 bg-slate-950/55 p-4 text-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Install App</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            {showIosHint
              ? "Open Share and select Add to Home Screen."
              : "Install Chakra Healing for a faster full-screen experience."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            window.localStorage.setItem(STORAGE_KEY, "true");
          }}
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
        >
          Dismiss
        </button>
      </div>

      {!showIosHint && installEvent ? (
        <button
          type="button"
          onClick={async () => {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            if (choice.outcome === "dismissed") {
              setDismissed(true);
              window.localStorage.setItem(STORAGE_KEY, "true");
            } else {
              setInstalled(true);
            }
            setInstallEvent(null);
          }}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-amber-100 px-5 py-2 text-sm font-medium text-slate-950"
        >
          Install App
        </button>
      ) : null}
    </div>
  );
}

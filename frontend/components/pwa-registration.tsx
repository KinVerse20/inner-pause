"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { usePlayer } from "@/components/player-provider";

export function PwaRegistration() {
  const pathname = usePathname();
  const { isPlaying } = usePlayer();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let mounted = true;

    navigator.serviceWorker
      .register("/sw.js")
      .then((nextRegistration) => {
        if (!mounted) return;
        setRegistration(nextRegistration);

        if (nextRegistration.waiting) {
          setUpdateReady(true);
        }

        nextRegistration.addEventListener("updatefound", () => {
          const worker = nextRegistration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        // ignore registration failures and keep the app usable in the browser
      });

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const hidden = pathname === "/player" || pathname.endsWith("/player");

  if (!updateReady || hidden) return null;

  return (
    <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+1rem)] z-40 mx-auto max-w-xl rounded-[1.25rem] border border-white/10 bg-slate-950/92 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-white">New version available</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {isPlaying ? "Finish or pause your music before refreshing." : "Refresh when ready to update the app."}
          </p>
        </div>
        <button
          type="button"
          disabled={isPlaying}
          onClick={() => registration?.waiting?.postMessage({ type: "SKIP_WAITING" })}
          className="rounded-full bg-white/92 px-4 py-2 text-xs font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

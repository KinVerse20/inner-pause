import Link from "next/link";

import { HarmonyFormVisual } from "@/components/harmony-form-visual";

// Any address that isn't a page: the same calm frame as Entry, and a way home.
export default function NotFound() {
  return (
    <main
      className="grid min-h-dvh place-items-center px-8 text-center"
      style={{
        background: "radial-gradient(90% 55% at 50% 38%, var(--ds-accent-soft) 0%, var(--ds-bg) 70%)",
        color: "var(--ds-text)",
        fontFamily: "var(--ds-font-sans)",
      }}
    >
      <div className="grid max-w-[20rem] justify-items-center">
        <HarmonyFormVisual playing={false} className="ds-only-light w-28 opacity-80" />
        <HarmonyFormVisual playing={false} dark className="ds-only-dark w-28 opacity-80" />
        <h1 className="ds-h2 mt-8">This page isn&rsquo;t here</h1>
        <p className="mt-2 text-[0.95rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
          The link may be old, or the page has moved. Nothing you&rsquo;ve saved is affected.
        </p>
        <Link href="/" className="ds-filled mt-7 px-8">
          Back to Home
        </Link>
      </div>
    </main>
  );
}

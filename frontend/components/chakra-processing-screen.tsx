"use client";

import { useEffect, useState } from "react";

const messages = [
  "Understanding what you shared",
  "Noticing the emotions beneath it",
  "Connecting what may be affecting you",
  "Preparing your personalised reset",
];

const chakraColors = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#38bdf8", "#6366f1", "#a855f7"];

export function ChakraProcessingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setMessageIndex((index) => (index + 1) % messages.length), 1700);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[radial-gradient(circle_at_50%_12%,rgba(123,77,255,0.22),transparent_18rem),linear-gradient(180deg,#fcfbff,#f3f0ff)] px-5 text-[var(--ip-ink)]">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-[var(--ip-border)] bg-white/78 p-5 text-center shadow-[0_24px_60px_rgba(108,62,244,0.18)] backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ip-purple)]">The Inner Pause</p>
        <h1 className="mt-2 font-serif text-2xl text-[var(--ip-ink)]">Activating your emotion reset</h1>
        <div className="relative mx-auto mt-5 h-64 max-w-xs overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_50%_45%,rgba(123,77,255,0.2),transparent_48%),linear-gradient(180deg,#ffffff,#ede8ff)]">
          <div className="absolute inset-0 mvp-energy-wave opacity-30" />
          <div className="absolute left-1/2 top-8 h-48 w-px -translate-x-1/2 bg-[var(--ip-border-strong)]" />
          <div className="absolute left-1/2 top-8 flex h-48 -translate-x-1/2 flex-col justify-between">
            {chakraColors.map((color, index) => (
              <span
                key={color}
                className="chakra-activation-dot h-5 w-5 rounded-full border border-white/50 shadow-[0_0_24px_currentColor]"
                style={{ color, backgroundColor: color, animationDelay: `${index * 0.28}s` }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full border border-[var(--ip-border)] bg-white/80 px-4 py-2 text-sm text-[var(--ip-ink)] backdrop-blur-xl">
            Calm • Balanced • Connected
          </div>
        </div>
        <p aria-live="polite" className="mt-5 min-h-6 text-sm font-medium text-[var(--ip-ink)]">
          {messages[messageIndex]}
        </p>
        <p className="mt-1 text-xs text-[var(--ip-muted)]">This will only take a moment.</p>
      </div>
    </div>
  );
}

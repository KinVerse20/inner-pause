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
    <div className="fixed inset-0 z-50 grid place-items-center bg-[radial-gradient(circle_at_50%_25%,rgba(167,139,250,0.45),transparent_24rem),linear-gradient(180deg,#fbf8ff,#efe7ff)] px-5 text-[#130b4f]">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-purple-200 bg-white/72 p-6 text-center shadow-[0_24px_70px_rgba(88,28,135,0.22)] backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-[#7c3aed]">The Inner Pause</p>
        <h1 className="mt-2 font-serif text-2xl text-[#130b4f]">Activating your emotion reset</h1>
        <div className="relative mx-auto mt-6 h-72 max-w-sm overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.3),transparent_36%),linear-gradient(180deg,#2e1065,#120b4f)]">
          <div className="absolute inset-0 mvp-energy-wave opacity-50" />
          <div className="absolute left-1/2 top-8 h-56 w-px -translate-x-1/2 bg-white/20" />
          <div className="absolute left-1/2 top-8 flex h-56 -translate-x-1/2 flex-col justify-between">
            {chakraColors.map((color, index) => (
              <span
                key={color}
                className="chakra-activation-dot h-5 w-5 rounded-full border border-white/50 shadow-[0_0_24px_currentColor]"
                style={{ color, backgroundColor: color, animationDelay: `${index * 0.28}s` }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-5 mx-auto w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-xl">
            Calm • Balanced • Connected
          </div>
        </div>
        <p aria-live="polite" className="mt-5 min-h-6 text-sm font-medium text-[#26156f]">
          {messages[messageIndex]}
        </p>
        <p className="mt-1 text-xs text-[#6d5ea8]">This will only take a moment.</p>
      </div>
    </div>
  );
}

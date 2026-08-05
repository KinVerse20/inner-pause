"use client";

import type { ReactNode } from "react";

export function BlushCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 max-w-full overflow-hidden rounded-[1.65rem] border border-white/70 bg-white/68 shadow-[0_18px_46px_rgba(152,117,139,0.14)] backdrop-blur-2xl ${className}`}>
      {children}
    </section>
  );
}

export function CircularActionButton({
  children,
  label,
  onClick,
  className = "",
  pressed,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={`blush-action-button relative grid h-20 w-20 place-items-center rounded-full border border-white/80 bg-white/78 text-3xl text-[#d58e93] shadow-[0_16px_38px_rgba(213,142,147,0.24)] backdrop-blur-xl transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#d79bb8] active:scale-[0.98] ${className}`}
    >
      {pressed ? <span className="absolute inset-[-0.55rem] animate-ping rounded-full border border-[#d79bb8]/40" /> : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function SunriseScene({ children, variant = "sunrise" }: { children?: ReactNode; variant?: "sunrise" | "lake" | "plan" }) {
  return (
    <div className={`blush-scene blush-scene-${variant} relative overflow-hidden rounded-[2rem] border border-white/65 bg-[#fff4ee] shadow-[0_26px_70px_rgba(169,154,200,0.18)]`}>
      <div className="blush-sun" />
      <div className="blush-mist blush-mist-one" />
      <div className="blush-mist blush-mist-two" />
      <div className="blush-mountains blush-mountains-back" />
      <div className="blush-mountains blush-mountains-front" />
      <div className="blush-lake">
        <span className="blush-ripple blush-ripple-one" />
        <span className="blush-ripple blush-ripple-two" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function ChakraStonePath({
  stones,
}: {
  stones: Array<{
    key: string;
    label: string;
    color: string;
    completed: boolean;
    current: boolean;
    locked: boolean;
    onClick: () => void;
  }>;
}) {
  return (
    <div className="relative mx-auto flex min-h-[clamp(16rem,44dvh,21rem)] w-full max-w-[16rem] flex-col items-center justify-center py-4 sm:py-5">
      <div className="absolute inset-y-8 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#d79bb8]/32 to-transparent" />
      {stones.map((stone, index) => (
        <button
          key={stone.key}
          type="button"
          onClick={stone.onClick}
          className={`blush-stone relative z-10 -mt-1 first:mt-0 grid place-items-center border border-white/56 text-xs font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-[#d79bb8] ${
            stone.current ? "blush-stone-current" : ""
          } ${stone.completed ? "blush-stone-complete" : ""} ${stone.locked ? "opacity-42" : "opacity-100"}`}
          style={{
            width: `${4.4 + index * 0.18}rem`,
            height: `${2.35 + index * 0.08}rem`,
            background: `linear-gradient(180deg, ${stone.color}ee, ${stone.color}9c)`,
            boxShadow: stone.completed || stone.current ? `0 14px 36px ${stone.color}55` : undefined,
          }}
          aria-label={`${stone.label}${stone.locked ? " locked" : stone.current ? " current" : ""}`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}

export function InsightRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative mx-auto grid h-[clamp(9.25rem,34vw,13rem)] w-[clamp(9.25rem,34vw,13rem)] place-items-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from -40deg, #d79bb8 ${clamped * 3.6}deg, rgba(255,255,255,0.58) 0deg)`,
          mask: "radial-gradient(circle, transparent 54%, black 56%)",
          WebkitMask: "radial-gradient(circle, transparent 54%, black 56%)",
        }}
      />
      <div className="absolute inset-4 rounded-full border border-white/70 bg-white/48 shadow-inner" />
      <div className="relative text-center">
        <p className="font-serif text-[clamp(2.15rem,8vw,3rem)] text-[#322d42]">{clamped}%</p>
        <p className="mt-1 text-xs text-[#6f687d]">Calm score</p>
      </div>
    </div>
  );
}

export function BlushChoicePanel({
  title,
  choices,
  onClose,
}: {
  title: string;
  choices: Array<{ label: string; onClick: () => void }>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#322d42]/24 px-3 pb-3 backdrop-blur-[3px] sm:items-center sm:justify-center">
      <button type="button" className="absolute inset-0" aria-label="Close choices" onClick={onClose} />
      <section className="relative z-10 max-h-[calc(100dvh_-_1.5rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] w-full max-w-md overflow-y-auto rounded-[1.8rem] border border-white/70 bg-[#fffaf6]/92 p-4 shadow-[0_24px_70px_rgba(50,45,66,0.18)] backdrop-blur-2xl">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-[#d79bb8]/38" />
        <h2 className="text-center font-serif text-2xl text-[#322d42]">{title}</h2>
        <div className="mt-4 grid gap-2">
          {choices.map((choice) => (
            <button key={choice.label} type="button" onClick={choice.onClick} className="min-h-12 rounded-full border border-[#f1d6d0] bg-white/72 px-4 text-sm font-semibold text-[#322d42] shadow-sm transition hover:bg-[#fbedee]">
              {choice.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

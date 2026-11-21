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
    <section className={`obsidian-panel min-w-0 max-w-full overflow-hidden rounded-[1.35rem] ${className}`}>
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
      className={`tap-ripple relative grid h-20 w-20 place-items-center rounded-full border border-[rgba(255,138,50,0.42)] bg-[rgba(35,37,39,0.86)] text-3xl text-[var(--gold-light)] shadow-[0_0_38px_rgba(255,138,50,0.16)] backdrop-blur-xl transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] active:scale-[0.98] ${className}`}
    >
      {pressed ? <span className="absolute inset-[-0.55rem] animate-ping rounded-full border border-[var(--gold-primary)]/45" /> : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function SunriseScene({ children }: { children?: ReactNode; variant?: "sunrise" | "lake" | "plan" }) {
  return (
    <div className="relative min-w-0 overflow-hidden border-y border-white/10 bg-white/[0.018] lg:border-y-0 lg:bg-transparent">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,122,34,0.10),transparent_20rem),linear-gradient(180deg,rgba(255,255,255,0.025),transparent)]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/2 h-44 w-[110%] -translate-x-1/2 rounded-[50%] border border-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-10 left-1/2 h-24 w-[92%] -translate-x-1/2 rounded-[50%] border border-[rgba(255,122,34,0.08)]" />
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
      <div className="absolute inset-y-8 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--gold-border)] to-transparent" />
      {stones.map((stone, index) => (
        <button
          key={stone.key}
          type="button"
          onClick={stone.onClick}
      className={`blush-stone relative z-10 -mt-1 first:mt-0 grid place-items-center border border-white/70 text-xs font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] ${
            stone.current ? "blush-stone-current" : ""
          } ${stone.completed ? "blush-stone-complete" : ""} ${stone.locked ? "opacity-42" : "opacity-100"}`}
          style={{
            width: `${4.4 + index * 0.18}rem`,
            height: `${2.35 + index * 0.08}rem`,
          background: `linear-gradient(180deg, ${stone.color}ee, ${stone.color}b0)`,
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
          background: `conic-gradient(from -40deg, #F47A22 ${clamped * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
          mask: "radial-gradient(circle, transparent 54%, black 56%)",
          WebkitMask: "radial-gradient(circle, transparent 54%, black 56%)",
        }}
      />
      <div className="absolute inset-4 rounded-full border border-[var(--gold-border-soft)] bg-black/25 shadow-inner" />
      <div className="relative text-center">
        <p className="font-serif text-[clamp(2.15rem,8vw,3rem)] text-[var(--gold-light)]">{clamped}%</p>
        <p className="mt-1 text-xs text-[var(--ip-muted)]">Calm score</p>
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 px-3 pb-3 backdrop-blur-[3px] sm:items-center sm:justify-center">
      <button type="button" className="absolute inset-0" aria-label="Close choices" onClick={onClose} />
      <section className="obsidian-panel relative z-10 max-h-[calc(100dvh_-_1.5rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] w-full max-w-md overflow-y-auto rounded-[1.8rem] p-4">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-[var(--gold-primary)]/70 shadow-[0_0_14px_rgba(255,138,42,0.45)]" />
        <h2 className="text-center text-2xl text-[var(--ip-ink)]">{title}</h2>
        <div className="mt-4 grid gap-2">
          {choices.map((choice) => (
            <button key={choice.label} type="button" onClick={choice.onClick} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--ip-body)] shadow-sm transition hover:border-[rgba(255,138,42,0.45)] hover:text-[var(--gold-light)]">
              {choice.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

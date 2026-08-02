"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/journal", label: "Journal", icon: "✎" },
  { href: "/healing", label: "Healing", icon: "✦" },
  { href: "/insights", label: "Insights", icon: "◎" },
  { href: "/profile", label: "Profile", icon: "♙" },
];

export function MvpShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="mvp-bg min-h-dvh overflow-x-hidden text-[var(--cream)]">
      <main
        className="mx-auto min-h-dvh w-full max-w-5xl px-3.5 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-5"
        style={{ paddingBottom: hideNav ? "calc(1rem + env(safe-area-inset-bottom))" : "var(--page-bottom-padding)" }}
      >
        {children}
      </main>
      {!hideNav ? <MvpBottomNav /> : null}
    </div>
  );
}

export function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`} aria-label="The InnerPause home">
      <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--gold-border-soft)] bg-black/30 shadow-[0_0_28px_rgba(178,89,231,0.2)]">
        <Image src="/branding/innerpause-icon.png" alt="" fill sizes="36px" className="object-cover" priority={compact} />
      </span>
      {!compact ? (
        <span>
          <span className="block font-serif text-xl leading-none text-[var(--gold-light)]">The InnerPause</span>
          <span className="mt-1 block text-xs uppercase tracking-[0.22em] text-[var(--gold-muted)]">Heal Within</span>
        </span>
      ) : null}
    </Link>
  );
}

function MvpBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 min-h-[var(--bottom-nav-height)] border-t border-[var(--gold-border-soft)] bg-[#030711]/88 backdrop-blur-2xl">
      <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1.5">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`grid min-h-12 place-items-center rounded-xl text-center text-[0.68rem] transition focus:outline-none focus:ring-2 focus:ring-[var(--gold-light)] ${
                active ? "text-[var(--gold-light)]" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
              <span className={`h-0.5 w-6 rounded-full ${active ? "bg-[var(--gold-primary)] shadow-[0_0_14px_rgba(244,189,94,0.55)]" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function GoldButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-full border border-[var(--gold-border)] bg-[linear-gradient(135deg,rgba(244,189,94,0.95),rgba(178,89,231,0.55))] px-4 py-2.5 font-semibold text-[#120b16] shadow-[0_0_24px_rgba(244,189,94,0.16)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}

export function GlassCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={`rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--background-card)] shadow-[0_16px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div>
      {eyebrow ? <p className="text-xs uppercase tracking-[0.28em] text-[var(--gold-muted)]">{eyebrow}</p> : null}
      <h1 className="mt-1 font-serif text-3xl leading-tight text-[var(--gold-light)] sm:text-5xl">{title}</h1>
      {copy ? <p className="mt-2 max-w-2xl text-sm leading-5 text-stone-300">{copy}</p> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";

const navItems = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/journey", label: "Journey", icon: "♧" },
  { href: "/journal", label: "Journal", icon: "✎" },
  { href: "/insights", label: "Insights", icon: "▥" },
  { href: "/healing", label: "Healing", icon: "✦" },
];

export function MvpShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="mvp-bg min-h-dvh overflow-x-hidden text-[var(--cream)]">
      {!hideNav ? <MvpTopMenu /> : null}
      <main
        className="mx-auto min-h-dvh w-full max-w-[28rem] px-3.5 pt-[calc(4.2rem+env(safe-area-inset-top))] sm:px-5 md:max-w-[42rem] lg:max-w-[60rem] xl:max-w-[68rem]"
        style={{ paddingBottom: hideNav ? "calc(1rem + env(safe-area-inset-bottom))" : "var(--page-bottom-padding)" }}
      >
        {children}
      </main>
      {!hideNav ? <MvpBottomNav /> : null}
    </div>
  );
}


function MvpTopMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setOpen(false));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const signOut = () => {
    auth.signOut();
    setOpen(false);
    router.replace("/auth");
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/66 pt-[env(safe-area-inset-top)] shadow-[0_8px_28px_rgba(213,142,147,0.1)] backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-[28rem] items-center justify-between px-3.5 sm:px-5 md:max-w-[42rem] lg:max-w-[60rem] xl:max-w-[68rem]">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="innerpause-top-menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/74 text-xl text-[#a99ac8] shadow-sm transition hover:bg-[#fff8f4] focus:outline-none focus:ring-2 focus:ring-[#d79bb8]"
          >
            {open ? "×" : "☰"}
          </button>

          <BrandLogo compact />

          <div className="h-11 w-11" aria-hidden="true" />
        </div>
      </header>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-[#130b4f]/20 backdrop-blur-[2px]"
          />
          <div
            id="innerpause-top-menu"
            className="fixed left-1/2 top-[calc(4rem+env(safe-area-inset-top))] z-50 w-[calc(100%-1.5rem)] max-w-[27rem] -translate-x-1/2 rounded-[1.25rem] border border-[var(--ip-border)] bg-white p-3 shadow-[0_22px_55px_rgba(58,35,133,0.22)]"
          >
            <nav className="grid gap-1">
              {navItems.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--ip-lavender)] text-[var(--ip-purple)]"
                        : "text-[var(--ip-ink)] hover:bg-purple-50"
                    }`}
                  >
                    <span className="w-6 text-center text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {auth.profile ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-left text-sm font-medium text-[var(--ip-ink)] transition hover:bg-purple-50"
                >
                  <span className="w-6 text-center text-lg">↩</span>
                  <span>Logout</span>
                </button>
              ) : null}
            </nav>
          </div>
        </>
      ) : null}
    </>
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
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`} aria-label="The Inner Pause home">
      <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--ip-border)] bg-white shadow-[0_8px_24px_rgba(108,62,244,0.12)]">
        <Image src="/branding/innerpause-icon.png" alt="" fill sizes="36px" className="object-cover" priority={compact} />
      </span>
      {!compact ? (
        <span>
          <span className="block font-serif text-xl leading-none text-[var(--gold-light)]">The Inner Pause</span>
          <span className="mt-1 block text-xs uppercase tracking-[0.22em] text-[var(--gold-muted)]">Pause and reset</span>
        </span>
      ) : null}
    </Link>
  );
}

function MvpBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 min-h-[var(--bottom-nav-height)] border-t border-[var(--ip-border)] bg-white/90 shadow-[0_-14px_36px_rgba(108,62,244,0.12)] backdrop-blur-2xl">
      <div className="mx-auto grid max-w-[28rem] grid-cols-5 gap-1 rounded-t-[1.55rem] border border-white/70 bg-white/82 px-2 pb-[calc(0.42rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_42px_rgba(152,117,139,0.16)] backdrop-blur-2xl md:max-w-[42rem] lg:max-w-[60rem] xl:max-w-[68rem]">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`grid min-h-12 place-items-center rounded-xl text-center text-[0.68rem] transition focus:outline-none focus:ring-2 focus:ring-[#d79bb8] ${
                active ? "bg-[#f2eaf5] text-[#a99ac8]" : "text-[#90879d] hover:text-[#322d42]"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
              <span className={`h-0.5 w-5 rounded-full ${active ? "bg-[#d79bb8] shadow-[0_0_12px_rgba(215,155,184,0.32)]" : "bg-transparent"}`} />
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
      className={`min-h-11 rounded-full border border-purple-400/30 bg-[linear-gradient(135deg,var(--ip-purple-2),var(--ip-purple))] px-4 py-2.5 font-semibold text-white shadow-[0_12px_24px_rgba(108,62,244,0.22)] transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
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
      className={`rounded-[1.25rem] border border-[var(--ip-border)] bg-[var(--ip-card)] shadow-[0_14px_34px_rgba(108,62,244,0.09)] backdrop-blur-xl ${className}`}
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
      <h1 className="mt-1 font-serif text-3xl leading-tight text-[var(--ip-ink)] sm:text-5xl">{title}</h1>
      {copy ? <p className="mt-2 max-w-2xl text-sm leading-5 text-[var(--ip-body)]">{copy}</p> : null}
    </div>
  );
}

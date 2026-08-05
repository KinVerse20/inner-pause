"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";

const navItems = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/insights", label: "Reflect", icon: "✧" },
  { href: "/journal", label: "Express", icon: "✎" },
  { href: "/healing", label: "Restore", icon: "♧" },
  { href: "/profile", label: "Profile", icon: "◎" },
];

const desktopNavItems = [
  { href: "/insights", label: "Reflect" },
  { href: "/journal", label: "Express" },
  { href: "/healing", label: "Restore" },
];

export function MvpShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="mvp-bg min-h-dvh overflow-x-hidden text-[var(--cream)]">
      {!hideNav ? <MvpTopMenu /> : null}
      <main
        className="mx-auto min-h-dvh w-full max-w-[28rem] px-3.5 pt-[calc(4.5rem+env(safe-area-inset-top))] sm:px-5 md:max-w-[42rem] lg:max-w-[74rem] xl:max-w-[88rem]"
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--gold-border-soft)] bg-[#07142f]/78 pt-[env(safe-area-inset-top)] shadow-[0_12px_38px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
        <div className="mx-auto grid h-14 max-w-[28rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-3.5 sm:px-5 md:max-w-[42rem] lg:max-w-[74rem] xl:max-w-[88rem]">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="innerpause-top-menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-[#19264d]/62 text-xl text-[var(--gold-light)] shadow-sm transition hover:bg-[#253362] focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] lg:hidden"
          >
            {open ? "×" : "☰"}
          </button>

          <BrandLogo compact className="justify-center lg:justify-start" />

          <nav className="hidden items-center justify-center gap-8 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ip-muted)] lg:flex">
            {desktopNavItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-2 transition hover:text-[var(--gold-light)] ${
                    active ? "text-[var(--gold-light)] after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-[var(--gold-primary)]" : ""
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <Link href="/about" className="hidden h-10 min-w-10 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-[#19264d]/54 text-[var(--gold-light)] transition hover:bg-[#253362] lg:grid" aria-label="About The Inner Pause">
              ☼
            </Link>
            <Link href="/profile" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-[#19264d]/54 text-[var(--gold-light)] transition hover:bg-[#253362]" aria-label="Profile">
              ◎
            </Link>
          </div>
        </div>
      </header>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-[#07142f]/55 backdrop-blur-[2px] lg:hidden"
          />
          <div
            id="innerpause-top-menu"
            className="fixed left-1/2 top-[calc(4rem+env(safe-area-inset-top))] z-50 w-[calc(100%-1.5rem)] max-w-[27rem] -translate-x-1/2 rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[#111e41]/94 p-3 shadow-[0_22px_55px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:hidden"
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
                        ? "bg-[rgba(240,206,160,0.12)] text-[var(--gold-light)]"
                        : "text-[var(--ip-muted)] hover:bg-white/5 hover:text-[var(--gold-light)]"
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
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-left text-sm font-medium text-[var(--ip-muted)] transition hover:bg-white/5 hover:text-[var(--gold-light)]"
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
      <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--gold-border-soft)] bg-[#07142f] shadow-[0_0_24px_rgba(240,206,160,0.18)]">
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
    <nav className="fixed inset-x-0 bottom-0 z-40 min-h-[var(--bottom-nav-height)] border-t border-[var(--gold-border-soft)] bg-[#07142f]/84 shadow-[0_-14px_36px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid max-w-[28rem] grid-cols-5 gap-1 rounded-t-[1.55rem] border border-[var(--gold-border-soft)] bg-[#111e41]/82 px-2 pb-[calc(0.42rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_42px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:max-w-[42rem]">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`grid min-h-12 place-items-center rounded-xl text-center text-[0.68rem] transition focus:outline-none focus:ring-2 focus:ring-[#d79bb8] ${
                active ? "bg-[rgba(240,206,160,0.12)] text-[var(--gold-light)]" : "text-[var(--ip-muted)] hover:text-[var(--gold-light)]"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
              <span className={`h-0.5 w-5 rounded-full ${active ? "bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(240,206,160,0.38)]" : "bg-transparent"}`} />
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
      className={`min-h-11 rounded-full border border-[var(--gold-border)] bg-[linear-gradient(135deg,#f6dfc1,#ddb27b)] px-4 py-2.5 font-semibold text-[#07142f] shadow-[0_0_24px_rgba(240,206,160,0.18)] transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
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
      className={`rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--ip-card)] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
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

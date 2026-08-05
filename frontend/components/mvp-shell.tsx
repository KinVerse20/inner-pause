"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";

const navItems = [
  { href: "/", label: "Portal", icon: "⌂" },
  { href: "/journal", label: "Express", icon: "♩" },
  { href: "/analysis", label: "Analysis", icon: "✦" },
  { href: "/healing", label: "Sessions", icon: "♬" },
  { href: "__more__", label: "More", icon: "◎" },
];

const desktopNavItems = [
  { href: "/", label: "Portal", icon: "◌" },
  { href: "/journal", label: "Speak / Express", icon: "♩" },
  { href: "/analysis", label: "Analysis", icon: "✦" },
  { href: "/journey", label: "Chakra Topology", icon: "☸" },
  { href: "/history", label: "Frequency Logs", icon: "☷" },
  { href: "/healing", label: "Healing Sessions", icon: "♬" },
  { href: "/about", label: "Library", icon: "✧" },
  { href: "/profile", label: "Profile", icon: "◎" },
  { href: "/profile", label: "Settings", icon: "⚙" },
];

export function MvpShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="mvp-bg min-h-dvh overflow-x-hidden text-[var(--ip-ink)]">
      {!hideNav ? <PastelSidebar /> : null}
      {!hideNav ? <MvpTopMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} /> : null}
      <main
        className="mx-auto min-h-dvh w-full max-w-[28rem] px-3.5 pb-[var(--page-bottom-padding)] pt-[calc(4.5rem+env(safe-area-inset-top))] sm:px-5 md:max-w-[44rem] lg:ml-[17rem] lg:max-w-[calc(100vw-18.5rem)] lg:px-6 lg:pb-4 lg:pt-[calc(1.25rem+env(safe-area-inset-top))] xl:max-w-[calc(100vw-20rem)]"
        style={hideNav ? { paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" } : undefined}
      >
        {children}
      </main>
      {!hideNav ? <MvpBottomNav onOpenMenu={() => setMobileMenuOpen(true)} /> : null}
    </div>
  );
}

function PastelSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const signOut = () => {
    auth.signOut();
    router.replace("/auth");
  };

  return (
    <aside className="fixed bottom-4 left-4 top-4 z-40 hidden w-[15.5rem] rounded-[1.65rem] border border-[var(--gold-border-soft)] bg-white/68 p-4 shadow-[0_24px_70px_rgba(169,139,221,0.18)] backdrop-blur-2xl lg:flex lg:flex-col">
      <BrandLogo className="px-1" />
      <nav className="mt-8 grid gap-1.5">
        {desktopNavItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] ${
                active
                  ? "bg-[linear-gradient(135deg,rgba(231,221,248,0.92),rgba(252,228,236,0.88))] text-[var(--ip-ink)] shadow-[0_12px_26px_rgba(169,139,221,0.15)]"
                  : "text-[var(--ip-muted)] hover:bg-white/64 hover:text-[var(--ip-ink)]"
              }`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/58 text-[var(--gold-light)]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-white/58 p-3 text-sm text-[var(--ip-body)]">
        <p className="font-serif text-lg text-[var(--ip-ink)]">Soft reset</p>
        <p className="mt-1 text-xs leading-5">Pause, reflect and restore your inner rhythm.</p>
        {auth.profile ? (
          <button type="button" onClick={signOut} className="mt-3 min-h-10 w-full rounded-full border border-[var(--gold-border-soft)] bg-white/72 text-sm font-semibold text-[var(--gold-light)]">
            Logout
          </button>
        ) : null}
      </div>
    </aside>
  );
}


function MvpTopMenu({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    queueMicrotask(() => setOpen(false));
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, setOpen]);

  const signOut = () => {
    auth.signOut();
    setOpen(false);
    router.replace("/auth");
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--gold-border-soft)] bg-white/72 pt-[env(safe-area-inset-top)] shadow-[0_12px_38px_rgba(169,139,221,0.12)] backdrop-blur-2xl lg:hidden">
        <div className="mx-auto grid h-14 max-w-[28rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-3.5 sm:px-5 md:max-w-[42rem] lg:max-w-[74rem] xl:max-w-[88rem]">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="innerpause-top-menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/72 text-xl text-[var(--gold-light)] shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] lg:hidden"
          >
            {open ? "×" : "☰"}
          </button>

          <BrandLogo compact className="justify-center lg:justify-start" />

          <nav className="hidden items-center justify-center gap-8 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ip-muted)] lg:flex">
            {desktopNavItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={`${item.href}-${item.label}`}
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
            <Link href="/about" className="hidden h-10 min-w-10 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/64 text-[var(--gold-light)] transition hover:bg-white lg:grid" aria-label="About The Inner Pause">
              ☼
            </Link>
            <Link href="/profile" className="grid h-10 w-10 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/64 text-[var(--gold-light)] transition hover:bg-white" aria-label="Profile">
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
            className="fixed inset-0 z-40 bg-[#49316f]/18 backdrop-blur-[2px] lg:hidden"
          />
          <div
            id="innerpause-top-menu"
            role="dialog"
            aria-modal="true"
            aria-label="InnerPause navigation"
            className="fixed bottom-0 left-0 top-0 z-50 flex w-[min(88vw,23rem)] flex-col border-r border-[var(--gold-border-soft)] bg-white/92 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-[24px_0_70px_rgba(169,139,221,0.24)] backdrop-blur-2xl transition-transform lg:hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <BrandLogo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/74 text-xl text-[var(--gold-light)]"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div className="mt-6 rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-white/62 p-3 text-sm text-[var(--ip-body)]">
              <p className="font-serif text-xl text-[var(--ip-ink)]">Hello{auth.profile?.fullName ? `, ${auth.profile.fullName.split(" ")[0]}` : ""}</p>
              <p className="mt-1 text-xs leading-5">Use the same InnerPause sections on mobile and desktop.</p>
            </div>
            <nav className="mt-5 grid gap-1.5">
              {desktopNavItems.slice(0, 7).map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={`${item.href}-${item.label}-mobile-drawer`}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition ${
                      active
                        ? "bg-[linear-gradient(135deg,rgba(231,221,248,0.92),rgba(252,228,236,0.88))] text-[var(--ip-ink)] shadow-[0_12px_26px_rgba(169,139,221,0.15)]"
                        : "text-[var(--ip-muted)] hover:bg-white/70 hover:text-[var(--ip-ink)]"
                    }`}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/58 text-[var(--gold-light)]">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto space-y-3 rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-white/58 p-3">
              <div className="grid gap-1.5">
                {desktopNavItems.slice(7).map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={`${item.href}-${item.label}-mobile-account`}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition ${
                        active ? "bg-[var(--ip-lavender)] text-[var(--ip-ink)]" : "text-[var(--ip-muted)] hover:bg-white/70 hover:text-[var(--ip-ink)]"
                      }`}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/58 text-[var(--gold-light)]">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              {auth.profile ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--gold-border-soft)] bg-white/72 px-4 text-sm font-semibold text-[var(--gold-light)]"
                >
                  Logout
                </button>
              ) : null}
            </div>
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
      <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--gold-border-soft)] bg-white shadow-[0_0_24px_rgba(169,139,221,0.18)]">
        <Image src="/branding/innerpause-icon.png" alt="" fill sizes="36px" className="object-cover" priority={compact} />
      </span>
      {!compact ? (
        <span>
          <span className="block font-serif text-xl leading-none text-[var(--ip-ink)]">The Inner Pause</span>
          <span className="mt-1 block text-xs uppercase tracking-[0.22em] text-[var(--gold-muted)]">Pause and reset</span>
        </span>
      ) : null}
    </Link>
  );
}

function MvpBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 min-h-[var(--bottom-nav-height)] border-t border-[var(--gold-border-soft)] bg-white/54 shadow-[0_-14px_36px_rgba(169,139,221,0.14)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid max-w-[28rem] grid-cols-5 gap-1 rounded-t-[1.55rem] border border-[var(--gold-border-soft)] bg-white/78 px-2 pb-[calc(0.42rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_42px_rgba(169,139,221,0.16)] backdrop-blur-2xl md:max-w-[42rem]">
        {navItems.map((item) => {
          if (item.href === "__more__") {
            const active = pathname.startsWith("/profile") || pathname.startsWith("/about") || pathname.startsWith("/history") || pathname.startsWith("/journey");
            return (
              <button
                key={item.label}
                type="button"
                onClick={onOpenMenu}
                className={`grid min-h-12 place-items-center rounded-xl text-center text-[0.68rem] transition focus:outline-none focus:ring-2 focus:ring-[#d79bb8] ${
                  active ? "bg-[var(--ip-lavender)] text-[var(--gold-light)]" : "text-[var(--ip-muted)] hover:text-[var(--gold-light)]"
                }`}
                aria-label="Open full navigation menu"
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
                <span className={`h-0.5 w-5 rounded-full ${active ? "bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(169,139,221,0.3)]" : "bg-transparent"}`} />
              </button>
            );
          }
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`grid min-h-12 place-items-center rounded-xl text-center text-[0.68rem] transition focus:outline-none focus:ring-2 focus:ring-[#d79bb8] ${
                active ? "bg-[var(--ip-lavender)] text-[var(--gold-light)]" : "text-[var(--ip-muted)] hover:text-[var(--gold-light)]"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
              <span className={`h-0.5 w-5 rounded-full ${active ? "bg-[var(--gold-primary)] shadow-[0_0_12px_rgba(169,139,221,0.3)]" : "bg-transparent"}`} />
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
      className={`min-h-11 rounded-full border border-white/70 bg-[linear-gradient(135deg,#a98bdd,#f4b8cd_62%,#f5b792)] px-4 py-2.5 font-semibold text-white shadow-[0_16px_34px_rgba(169,139,221,0.22)] transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
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
      className={`rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--ip-card)] shadow-[0_18px_44px_rgba(169,139,221,0.13)] backdrop-blur-xl ${className}`}
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

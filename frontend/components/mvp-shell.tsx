"use client";

import Link from "next/link";
import { LiveShell } from '@/components/live-shell';
import Image from "next/image";
import type { ReactNode } from "react";

export function MvpShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return <LiveShell hideNav={hideNav}>{children}</LiveShell>;
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
      <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#232527] shadow-[0_0_24px_rgba(255,138,50,0.12)]">
        <Image src="/branding/innerpause-icon.png" alt="" fill sizes="36px" className="object-cover" priority={compact} />
      </span>
      {!compact ? (
        <span>
          <span className="block text-xl leading-none text-[var(--ip-ink)]">The InnerPause</span>
          <span className="mt-1 block text-xs uppercase tracking-[0.32em] text-[var(--gold-muted)]">Pause</span>
        </span>
      ) : null}
    </Link>
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
      className={`live-primary ${className}`}
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
      className={`live-card ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div>
      {eyebrow ? <p className="minimal-label text-xs">{eyebrow}</p> : null}
      <h1 className="mt-1 text-3xl font-medium leading-tight text-[var(--ip-ink)] sm:text-5xl">{title}</h1>
      {copy ? <p className="mt-2 max-w-2xl text-sm leading-5 text-[var(--ip-body)]">{copy}</p> : null}
    </div>
  );
}

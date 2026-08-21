"use client";

import Link from "next/link";
import type { ComponentType, CSSProperties, ReactNode } from "react";

import { IconChevronRight } from "@/components/pause-icons";

type IconType = ComponentType<{ className?: string; style?: CSSProperties }>;

// Shared row for You's hub/list screens — a label, optional icon, optional
// trailing status text, and a chevron when it navigates. Used identically
// across you-home-screen, you-account-screen, etc. so the whole area reads
// as one utility surface rather than several one-off layouts.
export function SettingsRow({
  href,
  label,
  description,
  status,
  Icon,
  onClick,
}: {
  href?: string;
  label: string;
  description?: string;
  status?: string;
  Icon?: IconType;
  onClick?: () => void;
}) {
  const content = (
    <>
      {Icon ? (
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
          style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-semibold">{label}</span>
        {description ? (
          <span className="block text-[0.78rem]" style={{ color: "var(--ds-text-secondary)" }}>
            {description}
          </span>
        ) : null}
      </span>
      {status ? (
        <span className="shrink-0 text-[0.78rem]" style={{ color: "var(--ds-text-secondary)" }}>
          {status}
        </span>
      ) : null}
      {href ? <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--ds-text-muted)" }} /> : null}
    </>
  );

  const className =
    "ds-tap flex w-full items-center gap-3 rounded-[var(--ds-radius-md)] px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]";
  const style: CSSProperties = { background: "var(--ds-surface)" };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} style={style}>
      {content}
    </button>
  );
}

// A plain grouping header used above a cluster of rows/sections.
export function SettingsSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ds-text-muted)" }}>
      {children}
    </h2>
  );
}

// Shared back link + page title header, matching moments-screen.tsx's
// pattern so every You screen looks like the same product.
export function YouScreenHeader({ title, backHref = "/profile", backLabel = "You" }: { title: string; backHref?: string; backLabel?: string }) {
  return (
    <header>
      <Link
        href={backHref}
        className="ds-tap inline-flex items-center gap-1 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
        style={{ color: "var(--ds-text-secondary)" }}
      >
        <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
        {backLabel}
      </Link>
      <h1 className="mt-2 text-[1.4rem] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>
    </header>
  );
}

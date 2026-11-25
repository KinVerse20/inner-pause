"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewTransition, type ComponentType, type CSSProperties, type ReactNode } from "react";

import { IconChevronRight } from "@/components/pause-icons";
import { markPageTransition, vtName } from "@/lib/view-transition";

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
  flush = false,
  tone,
}: {
  href?: string;
  label: string;
  description?: string;
  status?: string;
  Icon?: IconType;
  onClick?: () => void;
  flush?: boolean;
  /** A colour for the icon's circle (any CSS colour); the accent when unset. */
  tone?: string;
}) {
  const content = (
    <>
      {Icon ? (
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
          style={
            tone
              ? { background: `color-mix(in srgb, ${tone} 16%, var(--ds-surface))`, color: `color-mix(in srgb, ${tone} 85%, var(--ds-text))` }
              : { background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }
          }
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        {href ? (
          // The label rises into the title of the page it opens (YouScreenHeader).
          <span className="block text-[0.95rem] font-semibold">
            <ViewTransition name={vtName("title", href)} share="title-morph" default="none">
              <span className="inline-block">{label}</span>
            </ViewTransition>
          </span>
        ) : (
          <span className="block text-[0.95rem] font-semibold">{label}</span>
        )}
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

  const className = flush
    ? "ds-tap flex w-full items-center gap-3 px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ds-accent)]"
    : "ds-tap flex w-full items-center gap-3 rounded-[var(--ds-radius-md)] px-4 py-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]";
  const style: CSSProperties = flush ? {} : { background: "var(--ds-surface)" };

  if (href) {
    return (
      <Link href={href} onClick={() => markPageTransition("forward")} className={className} style={style}>
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
    <h2 className="px-1 text-[0.75rem] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ds-text-muted)" }}>
      {children}
    </h2>
  );
}

// Shared back link + page title header, matching moments-screen.tsx's
// pattern so every You screen looks like the same product.
export function YouScreenHeader({
  title,
  backHref = "/profile",
  backLabel = "You",
  Icon,
  tone,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  /** The page's icon, in the same colour as its row on You, so the two read as one. */
  Icon?: IconType;
  tone?: string;
}) {
  const pathname = usePathname();
  return (
    <header>
      <Link
        href={backHref}
        onClick={() => markPageTransition("back")}
        className="ds-tap -my-3.5 inline-flex min-h-11 items-center gap-1 pr-2 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
        style={{ color: "var(--ds-text-secondary)" }}
      >
        <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
        {backLabel}
      </Link>
      <div className="mt-2 flex items-center gap-3">
        {Icon && tone ? (
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
            style={{ background: `color-mix(in srgb, ${tone} 16%, var(--ds-surface))`, color: `color-mix(in srgb, ${tone} 85%, var(--ds-text))`, boxShadow: "var(--ds-elevation-1)" }}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <h1 className="ds-display text-[1.5rem]">
          <ViewTransition name={vtName("title", pathname)} share="title-morph" default="none">
            <span className="inline-block">{title}</span>
          </ViewTransition>
        </h1>
      </div>
    </header>
  );
}

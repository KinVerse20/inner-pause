import Link from "next/link";
import type { ReactNode } from "react";

import { LEGAL_UPDATED, OPERATOR_NAME, SUPPORT_EMAIL } from "@inner-pause/shared";

import { IconChevronRight } from "@/components/pause-icons";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

const DOCUMENTS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund and cancellation policy" },
];

// The shared layout for the legal pages (Terms, Privacy Policy, Refund and
// cancellation policy). Standalone, without the bottom navigation, so they
// read the same from sign-up, the Pass screen or a link from outside.
export function LegalPage({ title, intro, sections, current }: { title: string; intro: ReactNode; sections: LegalSection[]; current: string }) {
  return (
    <main
      className="min-h-dvh px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}
    >
      <article className="mx-auto max-w-2xl space-y-7">
        <Link
          href="/"
          className="ds-tap -my-3.5 inline-flex min-h-11 items-center gap-1 pr-2 text-xs font-medium"
          style={{ color: "var(--ds-accent)" }}
        >
          <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
          Inner Pause
        </Link>

        <header className="space-y-1.5">
          <h1 className="ds-display text-[1.75rem]">{title}</h1>
          <p className="text-[0.78rem]" style={{ color: "var(--ds-text-muted)" }}>
            Last updated {LEGAL_UPDATED}
          </p>
        </header>

        <div className="space-y-3 text-[0.94rem] leading-relaxed" style={{ color: "var(--ds-text-secondary)" }}>
          {intro}
        </div>

        {sections.map((section, index) => (
          <section key={section.heading} className="space-y-2.5">
            <h2 className="text-[1.05rem] font-semibold" style={{ color: "var(--ds-text)" }}>
              {index + 1}. {section.heading}
            </h2>
            <div className="space-y-3 text-[0.94rem] leading-relaxed [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-1.5" style={{ color: "var(--ds-text-secondary)" }}>
              {section.body}
            </div>
          </section>
        ))}

        <footer className="space-y-3 border-t pt-6 text-[0.86rem]" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-secondary)" }}>
          <p>
            Questions about this page? Write to {OPERATOR_NAME} at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2" style={{ color: "var(--ds-accent)" }}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4">
            {DOCUMENTS.filter((document) => document.href !== current).map((document) => (
              <Link key={document.href} href={document.href} className="ds-tap inline-flex min-h-11 items-center underline underline-offset-2" style={{ color: "var(--ds-accent)" }}>
                {document.label}
              </Link>
            ))}
          </nav>
        </footer>
      </article>
    </main>
  );
}

/** The support address as a mail link, for use inside legal text. */
export function SupportEmail() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2" style={{ color: "var(--ds-accent)" }}>
      {SUPPORT_EMAIL}
    </a>
  );
}

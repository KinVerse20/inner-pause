import Link from "next/link";

import { AboutStory } from "@/components/about-story";
import { IconChevronRight } from "@/components/pause-icons";
import { HOW_IT_WORKS } from "@/lib/how-it-works";

const DOCUMENTS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund and cancellation policy" },
];

// The public About page (open without entering the app, like the legal
// pages): the Inner Pause story and how it works, in our design. Same
// words as You → Help / About and Entry's "How it works".
export function AboutScreen() {
  return (
    <main
      className="min-h-dvh px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))]"
      style={{ background: "var(--ds-bg)", color: "var(--ds-text)", fontFamily: "var(--ds-font-sans)" }}
    >
      <article className="mx-auto max-w-2xl space-y-7">
        <Link href="/" className="ds-tap -my-3.5 inline-flex min-h-11 items-center gap-1 pr-2 text-xs font-medium" style={{ color: "var(--ds-accent)" }}>
          <IconChevronRight className="h-3.5 w-3.5" style={{ transform: "scaleX(-1)" }} />
          Inner Pause
        </Link>

        <AboutStory />

        <section aria-labelledby="about-how-title" className="space-y-3">
          <h2 id="about-how-title" className="ds-h2">
            How it works
          </h2>
          <ol className="ds-card divide-y divide-[color:var(--ds-border)]">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step.title} className="flex gap-3.5 px-5 py-4">
                <span className="ds-num grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm" style={{ background: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}>
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="ds-h3 block">{step.title}</span>
                  <span className="mt-0.5 block text-[0.92rem] leading-6" style={{ color: "var(--ds-text-secondary)" }}>
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="ds-caption" style={{ color: "var(--ds-text-muted)" }}>
            Inner Pause supports everyday wellbeing. It is not a substitute for medical or mental health care.
          </p>
        </section>

        <Link href="/" className="ds-filled w-full">
          Begin
        </Link>

        <footer className="flex flex-wrap gap-x-4 gap-y-2 border-t pt-6 text-[0.86rem]" style={{ borderColor: "var(--ds-border)" }}>
          {DOCUMENTS.map((doc) => (
            <Link key={doc.href} href={doc.href} className="ds-tap inline-flex min-h-11 items-center" style={{ color: "var(--ds-text-secondary)" }}>
              {doc.label}
            </Link>
          ))}
        </footer>
      </article>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";

import { AppPageHeader } from "@/components/chakra-path-ui";
import { ExpressionPanel } from "@/components/expression-panel";
import { MvpShell } from "@/components/mvp-shell";

export function JournalEntryScreen({
  initialContext,
  autoStartVoice = false,
}: {
  initialContext?: string;
  autoStartVoice?: boolean;
}) {
  const router = useRouter();
  const initialText = initialContext ? `${initialContext} — ` : "";

  return (
    <MvpShell>
      <div className="mx-auto max-w-3xl space-y-4">
        <AppPageHeader
          title="Express"
          copy="Speak or type what’s on your mind."
          backHref="/"
          right={(
            <button
            type="button"
            onClick={() => router.push("/history")}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--ip-border)] bg-white/78 px-3 text-xs font-semibold text-[var(--ip-purple)] shadow-sm"
            aria-label="View Details"
            title="See your earlier reflections and completed sessions."
          >
            <span aria-hidden="true">◷</span>
            <span>View Details</span>
          </button>
          )}
        />

        <ExpressionPanel initialText={initialText} autoStartVoice={autoStartVoice} />
      </div>
    </MvpShell>
  );
}

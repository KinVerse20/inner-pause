"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { GlassCard, GoldButton, MvpShell, SectionTitle } from "@/components/mvp-shell";
import { createJournalEntry, saveAnalysis } from "@/lib/mvp-storage";
import { EmotionalAnalysis, SaveMode } from "@/lib/mvp-types";

const prompts = [
  "What happened today?",
  "What stayed on your mind?",
  "Did anyone affect you strongly?",
  "What do you wish you had said?",
  "What are you carrying into tonight?",
];

const saveModes: Array<{ value: SaveMode; label: string; copy: string }> = [
  { value: "journal_and_analysis", label: "Save to Journal", copy: "Store the entry and create an emotional insight." },
  { value: "reset_only", label: "Create Reset Only", copy: "Use this entry for a session but do not keep it in journal history." },
  { value: "journal_without_analysis", label: "Save Without Analysis", copy: "Keep the reflection only." },
  { value: "temporary_analysis", label: "Temporary Entry", copy: "Reflect now and mark it temporary." },
];

export function JournalEntryScreen() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saveMode, setSaveMode] = useState<SaveMode>("journal_and_analysis");
  const [intensity, setIntensity] = useState(6);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);
  const timerRef = useRef<number | null>(null);

  const canSubmit = text.trim().length > 0;
  const resetOnly = saveMode === "reset_only";
  const privacyLine = saveMode !== "reset_only" ? "Your entry stays private on this device unless Supabase is configured." : "";

  const startRecording = () => {
    setRecording(true);
    setRecordingSeconds(0);
    timerRef.current = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    setError("Voice capture uses a browser mock here. Stop recording to append a dictated note, or connect speech-to-text later.");
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    setText((current) => `${current}${current ? "\n" : ""}Voice note: I want to understand what I am carrying today.`);
  };

  const submit = async (createAnalysis: boolean) => {
    if (!canSubmit) {
      setError("Write at least one sentence before continuing.");
      return;
    }
    setLoading(true);
    setError("");
    const entry = createJournalEntry({ rawText: text.trim(), saveMode, emotionalIntensityBefore: intensity });

    if (!createAnalysis || saveMode === "journal_without_analysis") {
      router.push("/history");
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json()) as { analysis?: EmotionalAnalysis; error?: string };
      if (!response.ok || !payload.analysis) throw new Error(payload.error ?? "Insight failed");
      saveAnalysis(entry.id, payload.analysis);
      router.push(`/analysis?entry=${entry.id}`);
    } catch {
      setError("We could not create an emotional insight right now. Please try again.");
      setLoading(false);
    }
  };

  const recordingLabel = useMemo(() => {
    const mins = Math.floor(recordingSeconds / 60);
    const secs = `${recordingSeconds % 60}`.padStart(2, "0");
    return `${mins}:${secs}`;
  }, [recordingSeconds]);

  return (
    <MvpShell>
      <div className="mx-auto max-w-3xl space-y-3.5">
        <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <button type="button" onClick={() => router.back()} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-[var(--gold-light)]" aria-label="Back">
            ←
          </button>
          <p className="min-w-0 text-center text-sm text-[var(--gold-muted)]">Today&apos;s Journal</p>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-[var(--gold-light)] transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--gold-light)] sm:text-sm"
            aria-label="View journal history"
          >
            <span aria-hidden="true">◷</span>
            <span>View History</span>
          </button>
        </header>

        <SectionTitle title="How was your day?" copy="One honest sentence is enough." />

        <GlassCard className="relative overflow-hidden p-3.5">
          <div className="pointer-events-none absolute inset-x-8 bottom-4 h-12 mvp-energy-wave opacity-35" />
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write about your day..."
            className="relative min-h-36 w-full resize-y rounded-[1rem] border border-[var(--gold-border-soft)] bg-black/24 p-3.5 text-base leading-6 text-stone-100 outline-none placeholder:text-stone-500 focus:ring-2 focus:ring-[var(--gold-light)]"
          />
          {privacyLine ? <p className="relative mt-2 text-xs text-stone-500">{privacyLine}</p> : null}
        </GlassCard>

        <button type="button" onClick={() => setShowPrompts((value) => !value)} className="min-h-10 rounded-full border border-white/10 bg-white/[0.04] px-4 text-left text-sm text-[var(--gold-light)]">
          {showPrompts ? "Hide prompts" : "Need a prompt?"}
        </button>

        {showPrompts ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setText((current) => `${current}${current ? "\n" : ""}${prompt} `)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-stone-300"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        <GlassCard className="p-3.5">
          <p className="text-sm font-semibold text-[var(--gold-light)]">Emotional intensity before session</p>
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            className="mt-2 w-full"
            aria-label="Emotional intensity before session"
          />
          <p className="mt-1 text-sm text-stone-400">{intensity}/10</p>
        </GlassCard>

        <div className="grid grid-cols-2 gap-2">
          {saveModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setSaveMode(mode.value)}
              className={`min-h-16 rounded-2xl border p-3 text-left ${saveMode === mode.value ? "border-[var(--gold-border)] bg-amber-300/10" : "border-white/10 bg-white/[0.04]"}`}
            >
              <span className="block text-sm font-medium text-stone-100">{mode.label}</span>
              <span className="mt-1 block line-clamp-1 text-xs text-stone-400">{mode.copy}</span>
            </button>
          ))}
        </div>

        {resetOnly ? (
          <p className="rounded-2xl border border-[var(--gold-border-soft)] bg-amber-300/10 p-3 text-sm text-stone-300">
            Reset-only entries are not stored in permanent history.
          </p>
        ) : null}

        {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <GoldButton disabled={!canSubmit || loading} onClick={() => submit(true)}>
            {loading ? "Creating Insight..." : "Create Emotional Insight"}
          </GoldButton>
          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={() => submit(false)}
            className="min-h-11 rounded-full border border-[var(--gold-border-soft)] px-4 py-2.5 font-semibold text-[var(--gold-light)] disabled:opacity-45"
          >
            Save Without Analysis
          </button>
        </div>

        <details className="rounded-[1.25rem] border border-[var(--gold-border-soft)] bg-[var(--background-card)] p-3.5">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--gold-light)]">Speak instead</summary>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[var(--gold-border)] bg-purple-500/14 text-2xl text-[var(--gold-light)] shadow-[0_0_32px_rgba(178,89,231,0.28)]"
              aria-pressed={recording}
            >
              {recording ? "■" : "🎙"}
            </button>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-medium text-stone-100">{recording ? `Recording ${recordingLabel}` : "Tap to Speak"}</p>
              <p className="mt-0.5 text-xs text-stone-500">Stop appends a browser mock note.</p>
            </div>
          </div>
        </details>
      </div>
    </MvpShell>
  );
}

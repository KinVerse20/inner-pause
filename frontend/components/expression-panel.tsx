"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ChakraProcessingScreen } from "@/components/chakra-processing-screen";
import { BlushCard } from "@/components/morning-blush-ui";
import { GoldButton } from "@/components/mvp-shell";
import { createFrontendApiClient } from "@/lib/auth/session";
import { createJournalEntry, saveAnalysis, savePlan } from "@/lib/mvp-storage";
import { EmotionalAnalysis } from "@/lib/mvp-types";

type SpeechRecognitionEventLike = Event & {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const emotionChips = ["Restless", "Quiet", "Melancholic", "Grounded", "Hopeful", "Anxious", "Overwhelmed", "Peaceful"];
const journalPrompts = ["What is here?", "What feels heavy?", "What can leave?", "What do you need?"];

export function ExpressionPanel({
  compact = false,
  embedded = false,
  initialMode = "speak",
}: {
  compact?: boolean;
  embedded?: boolean;
  initialMode?: "speak" | "write";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"speak" | "write">(initialMode);
  const [text, setText] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef("");

  const SpeechRecognition = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") return null;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!listening || !recordingStartedAt) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - recordingStartedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [listening, recordingStartedAt]);

  const startVoice = () => {
    setMode("speak");
    setVoiceError("");
    if (!SpeechRecognition) {
      setVoiceUnsupported(true);
      setVoiceError("Voice input is not available in this browser. You can still write.");
      return;
    }
    if (recognitionRef.current || listening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = "";
    voiceBaseRef.current = text.trim();

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      setText((current) => {
        const base = voiceBaseRef.current;
        const nextSpeech = `${finalTranscript}${interim}`.trim();
        return nextSpeech ? `${base ? `${base} ` : ""}${nextSpeech}` : current;
      });
    };

    recognition.onerror = (event) => {
      setVoiceError(event.error === "not-allowed" ? "Microphone permission was denied. You can still write." : "Voice input stopped. You can continue writing.");
      setListening(false);
      setPaused(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognitionRef.current = recognition;
      setListening(true);
      setPaused(false);
      setRecordingStartedAt(Date.now());
      setElapsed(0);
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceError("Voice input could not start. You can still write.");
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setPaused(false);
  };

  const retryVoice = () => {
    stopVoice();
    setText("");
    setElapsed(0);
    window.setTimeout(startVoice, 120);
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((current) => (current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion]));
  };

  const insertPrompt = (prompt: string) => {
    setMode("write");
    setText((current) => (current.trim() ? `${current.trim()}\n\n${prompt}\n` : `${prompt}\n`));
  };

  const expressionLevel = Math.min(100, Math.max(8, text.trim().length / 4 + selectedEmotions.length * 8));
  const dominantTone = selectedEmotions[0] ?? (text.trim() ? "Reflective" : "Waiting");

  const submit = async (overrideText?: string) => {
    const sourceText = overrideText ?? text;
    if (!sourceText.trim()) {
      setError("Share at least one sentence before continuing.");
      return;
    }
    stopVoice();
    setLoading(true);
    setError("");
    const decoratedText = selectedEmotions.length ? `${sourceText.trim()}\n\nEmotions selected: ${selectedEmotions.join(", ")}` : sourceText.trim();
    const entry = createJournalEntry({
      rawText: decoratedText,
      saveMode: "temporary_analysis",
      emotionalIntensityBefore: 6,
    });

    try {
      const api = createFrontendApiClient();
      const payload = (await api.analyseText(decoratedText)) as { analysis?: EmotionalAnalysis };
      if (!payload.analysis) throw new Error("Insight failed");
      saveAnalysis(entry.id, payload.analysis);
      savePlan(entry.id);
      window.setTimeout(() => router.push(`/analysis?entry=${entry.id}`), 900);
    } catch (caught) {
      setLoading(false);
      setError(caught instanceof Error ? caught.message : "We could not prepare your emotional insight right now. Please try again.");
    }
  };

  if (loading) return <ChakraProcessingScreen />;

  const hasRecording = text.trim().length > 0;
  const timerText = `${Math.floor(elapsed / 60)}:${`${elapsed % 60}`.padStart(2, "0")}`;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <BlushCard className="p-5 sm:p-6">
        {!embedded ? (
          <div className="text-center">
            <p className="minimal-label text-xs">{mode === "write" ? "Journal" : "Express"}</p>
            <h2 className="mt-2 text-[clamp(2.3rem,8vw,4.5rem)] font-medium leading-none text-[var(--ip-ink)]">
              {mode === "write" ? (compact ? "Write" : "Journal") : "Speak"}
            </h2>
          </div>
        ) : null}

        {mode === "speak" ? (
          <div className="mx-auto mt-6 flex max-w-md flex-col items-center text-center">
            <div className={`relative grid h-52 w-52 place-items-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_54%,rgba(255,138,42,0.22),transparent_18%),linear-gradient(145deg,#303336,#181a1c)] shadow-[0_28px_70px_rgba(0,0,0,0.36)] ${listening ? "shadow-[0_0_54px_rgba(255,138,42,0.22)]" : ""}`}>
              <span className={`absolute inset-[-0.65rem] rounded-full border border-[rgba(255,138,42,0.28)] ${listening ? "animate-ping" : "opacity-40"}`} />
              <span className="text-7xl text-[var(--gold-light)]">♩</span>
            </div>

            <p className="minimal-label mt-8 text-xs">{listening ? timerText : paused ? "Paused" : "Tap to begin"}</p>
            {listening ? <div className="mini-waveform mt-4 w-full max-w-xs" aria-hidden="true" /> : null}

            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              className={`tap-ripple mt-5 min-h-14 w-full max-w-xs rounded-full border px-6 text-base font-semibold uppercase tracking-[0.28em] transition focus:outline-none focus:ring-2 focus:ring-[var(--gold-primary)] ${listening ? "border-[rgba(255,138,42,0.75)] bg-[rgba(244,122,34,0.16)] text-[var(--gold-light)]" : "border-[rgba(255,138,42,0.5)] bg-[#232629] text-[var(--gold-light)] shadow-[0_0_28px_rgba(244,122,34,0.14)]"}`}
            >
              {listening ? "Stop" : "Speak"}
            </button>

            <div className="mt-3 grid w-full max-w-xs grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode("write")} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">Write</button>
              <button type="button" onClick={() => router.push("/")} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">Back</button>
            </div>

            {hasRecording && !listening ? (
              <div className="mt-5 grid w-full gap-2 sm:grid-cols-3">
                <button type="button" onClick={startVoice} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ip-body)]">Replay</button>
                <button type="button" onClick={retryVoice} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ip-body)]">Retry</button>
                <button type="button" onClick={() => submit()} className="min-h-12 rounded-full border border-[rgba(255,138,42,0.55)] bg-[rgba(244,122,34,0.12)] text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold-light)]">Reflect</button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 flex min-h-[min(50dvh,28rem)] flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="minimal-label text-xs">{journalPrompts[0]}</p>
            </div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Start writing what is here..."
              className="min-h-[15rem] flex-1 resize-none bg-transparent p-4 text-xl leading-8 text-[var(--ip-ink)] outline-none placeholder:text-[rgba(183,176,168,0.44)]"
            />
            <div className="flex min-h-14 items-center justify-between gap-3 border-t border-white/10 px-3 text-sm text-[var(--ip-muted)]">
              <button type="button" onClick={() => insertPrompt(journalPrompts[Math.floor(Math.random() * journalPrompts.length)])} className="min-h-10 rounded-full px-3 text-[var(--gold-light)]">Another</button>
              <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>
        )}

        {voiceUnsupported || voiceError ? <p className="mt-4 rounded-2xl border border-[rgba(255,138,42,0.3)] bg-[rgba(244,122,34,0.08)] p-3 text-sm text-[var(--ip-body)]">{voiceError || "Voice input is not available in this browser. You can still write."}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-red-400/35 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

        {mode === "write" ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <GoldButton className="flex-1" disabled={!text.trim()} onClick={() => submit()}>Reflect</GoldButton>
            <button type="button" onClick={() => setMode("speak")} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">Speak</button>
            <button type="button" onClick={() => { if (text && window.confirm("Remove the words currently written on this screen?")) setText(""); }} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">Clear</button>
          </div>
        ) : null}
      </BlushCard>

      <BlushCard className="p-4">
        <p className="minimal-label text-xs">Expression</p>
        <div className="mt-4 space-y-3">
          {[
            ["Level", `${Math.round(expressionLevel)}%`],
            ["Intensity", selectedEmotions.length ? "Active" : "Gentle"],
            ["Tone", dominantTone],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <span className="text-sm text-[var(--ip-body)]">{label}</span>
              <span className="text-lg text-[var(--gold-light)]">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <p className="minimal-label text-[0.66rem]">State</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {emotionChips.map((emotion) => (
              <button
                key={emotion}
                type="button"
                onClick={() => toggleEmotion(emotion)}
                className={`min-h-11 rounded-full border px-3 text-sm font-medium transition ${selectedEmotions.includes(emotion) ? "border-[rgba(255,138,42,0.65)] bg-[rgba(244,122,34,0.13)] text-[var(--gold-light)]" : "border-white/10 bg-white/[0.035] text-[var(--ip-body)]"}`}
              >
                {emotion}
              </button>
            ))}
          </div>
        </div>
      </BlushCard>
    </section>
  );
}

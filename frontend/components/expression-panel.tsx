"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ChakraProcessingScreen } from "@/components/chakra-processing-screen";
import { RitualBackdrop, RitualOrb, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { createFrontendApiClient } from "@/lib/auth/session";
import { createJournalEntry, saveAnalysis, savePlan } from "@/lib/mvp-storage";
import type { EmotionalAnalysis } from "@/lib/mvp-types";
import { useMvpState } from "@/lib/use-mvp-state";

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
const journalPrompts = [
  "What happened that is still sitting with you?",
  "What are you trying not to carry into tonight?",
  "What feels most true underneath the surface?",
  "What would make this feel a little lighter?",
];

export function ExpressionPanel({
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
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [draftForWitness, setDraftForWitness] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef("");
  const state = useMvpState();

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
      setVoiceError("Voice input is not available here. You can still write.");
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
      setVoiceError(event.error === "not-allowed" ? "Microphone access was denied. You can continue by writing." : "Voice input paused. You can still keep going.");
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognitionRef.current = recognition;
      setListening(true);
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
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((current) => (current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion]));
  };

  const insertPrompt = () => {
    const prompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    setText((current) => (current.trim() ? `${current.trim()}\n\n${prompt}\n` : `${prompt}\n`));
  };

  const submit = async () => {
    if (!text.trim()) {
      setError("Share at least one sentence before continuing.");
      return;
    }

    stopVoice();
    setLoading(true);
    setError("");
    const decoratedText = selectedEmotions.length ? `${text.trim()}\n\nEmotions selected: ${selectedEmotions.join(", ")}` : text.trim();
    setDraftForWitness(decoratedText);

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
      window.setTimeout(() => router.push(`/analysis?entry=${entry.id}`), 1400);
    } catch (caught) {
      setLoading(false);
      setError(caught instanceof Error ? caught.message : "We could not prepare your emotional insight right now.");
    }
  };

  const tone = inferWeatherTone(`${selectedEmotions.join(" ")} ${text.slice(0, 180)}`);
  const intensity = Math.min(1, Math.max(0.3, text.trim().length / 220 + (listening ? 0.28 : 0.08)));
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const timerText = `${Math.floor(elapsed / 60)}:${`${elapsed % 60}`.padStart(2, "0")}`;
  const recentReflections = state.entries
    .filter((entry) => entry.rawText.trim())
    .slice(0, 3)
    .map((entry) => ({
      id: entry.id,
      title: entry.title || entry.analysis?.emotions[0]?.name || "Reflection",
      copy: entry.analysis?.summary || entry.rawText.slice(0, 72),
    }));

  if (loading) {
    return <ChakraProcessingScreen draftText={draftForWitness || text} selectedEmotions={selectedEmotions} />;
  }

  return (
    <div className="journal-motion-flow space-y-4">
      <RitualBackdrop tone={tone} className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,24rem)] lg:items-center">
          <div className="journal-prompt-enter space-y-4">
            <p className="minimal-label text-xs">{mode === "write" ? "Write" : "Speak"}</p>
            <h2 className="font-serif text-[clamp(2.5rem,8vw,4.4rem)] leading-[0.95] text-[var(--gold-light)]">
              {mode === "write" ? "Write to release." : "Speak your heart."}
            </h2>
            <p className="max-w-xl text-base leading-7 text-[var(--ip-body)]">
              {mode === "write" ? "Put it down. Let it out." : "We listen, then reflect."}
            </p>

            <div className="flex flex-wrap gap-2">
              {emotionChips.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    selectedEmotions.includes(emotion)
                      ? "border-[rgba(244,122,34,0.45)] bg-[rgba(244,122,34,0.12)] text-[var(--gold-light)]"
                      : "border-white/10 bg-white/[0.035] text-[var(--ip-body)]"
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <div className="grid place-items-center gap-4">
            <RitualOrb
              stage={mode === "write" ? "write" : "speak"}
              tone={tone}
              active={listening || mode === "write"}
              intensity={mode === "write" ? Math.max(0.45, intensity) : intensity + (listening ? 0.1 : 0)}
              label="Expressive ritual orb"
            />
            <div className="w-full max-w-sm">
              <div className={`ritual-waveform ${!listening ? "is-paused" : ""}`} aria-hidden="true" />
              <p className="mt-3 text-center text-sm text-[var(--ip-body)]">
                {mode === "write"
                  ? `${words} words gathered so far.`
                  : listening
                    ? `${timerText} of listening.`
                    : "The space is waiting for your voice."}
              </p>
            </div>
            {recentReflections.length ? (
              <div className="hidden w-full max-w-sm rounded-[1.3rem] border border-white/10 bg-[rgba(11,15,33,0.48)] p-4 backdrop-blur-xl lg:block">
                <p className="minimal-label text-[0.62rem]">Recent reflections</p>
                <div className="mt-3 grid gap-3">
                  {recentReflections.map((reflection) => (
                    <div key={reflection.id} className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3">
                      <p className="font-serif text-lg text-[var(--ip-ink)]">{reflection.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{reflection.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </RitualBackdrop>

      {mode === "speak" ? (
        <div className="obsidian-panel rounded-[1.45rem] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={listening ? stopVoice : startVoice} className="min-h-12 rounded-full border border-[rgba(244,122,34,0.5)] bg-[rgba(244,122,34,0.1)] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)]">
              {listening ? "Stop" : "Start speaking"}
            </button>
            <button type="button" onClick={() => setMode("write")} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">
              Switch to write
            </button>
            <button type="button" onClick={() => router.push("/player?chakraId=heart&duration=20&mood=calm")} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">
              I just need relief
            </button>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Your words will settle here as you speak..."
            className="journal-input-enter mt-4 min-h-44 w-full resize-none rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-lg leading-8 text-[var(--ip-ink)] outline-none placeholder:text-[rgba(170,166,161,0.45)]"
          />
        </div>
      ) : (
        <div className="obsidian-panel rounded-[1.45rem] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setMode("speak")} className="min-h-11 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">
              Switch to speak
            </button>
            <button type="button" onClick={insertPrompt} className="min-h-11 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">
              Journal prompt
            </button>
            <button type="button" onClick={() => router.push("/player?chakraId=heart&duration=20&mood=calm")} className="min-h-11 rounded-full border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]">
              Relief instead
            </button>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Start with what feels hardest to carry..."
            className="journal-input-enter mt-4 min-h-[min(50dvh,26rem)] w-full resize-none rounded-[1.25rem] border border-white/10 bg-black/20 p-5 text-xl leading-9 text-[var(--ip-ink)] outline-none placeholder:text-[rgba(170,166,161,0.42)]"
          />
          <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[var(--ip-muted)]">
            <span>{words} words</span>
            <span>{selectedEmotions.length} emotional cues</span>
          </div>
        </div>
      )}

      {voiceUnsupported || voiceError || error ? (
        <div className="rounded-[1.2rem] border border-[rgba(244,122,34,0.28)] bg-[rgba(244,122,34,0.08)] p-4 text-sm leading-6 text-[var(--ip-body)]">
          {voiceError || error || "Voice input is not available here."}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={submit}
          className="min-h-12 flex-1 rounded-full border border-[rgba(244,122,34,0.55)] bg-[rgba(244,122,34,0.12)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)]"
        >
          Witness this
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ip-body)]"
        >
          Back to arrive
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ChakraProcessingScreen } from "@/components/chakra-processing-screen";
import { HelpTooltip } from "@/components/help-tooltip";
import { CircularActionButton, SunriseScene } from "@/components/morning-blush-ui";
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

const emotionChips = ["Anxious", "Angry", "Sad", "Overwhelmed", "Hurt", "Confused", "Tired", "Calm", "Something else"];

export function ExpressionPanel({ compact = false, embedded = false }: { compact?: boolean; embedded?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
  }, [SpeechRecognition]);

  const startVoice = () => {
    setPanelOpen(true);
    setVoiceError("");
    if (!SpeechRecognition) {
      setVoiceUnsupported(true);
      setVoiceError("Voice input is not available in this browser. You can still type your thoughts.");
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
      setVoiceError(event.error === "not-allowed" ? "Microphone permission was denied. You can still type your thoughts." : "Voice input stopped. You can continue typing.");
      setListening(false);
      setPaused(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setListening(false);
      setPaused(false);
      recognitionRef.current = null;
    };

    try {
      recognitionRef.current = recognition;
      setListening(true);
      setPaused(false);
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceError("Voice input could not start. You can still type your thoughts.");
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setPaused(false);
  };

  const pauseVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setPaused(true);
    setListening(false);
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((current) => (current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion]));
  };

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
      setError(
        caught instanceof Error
          ? caught.message
          : "We could not prepare your emotional insight right now. Please try again.",
      );
    }
  };

  if (loading) return <ChakraProcessingScreen />;

  return (
    <section className="space-y-3.5">
      {!panelOpen ? (
        <SunriseScene variant="lake">
          <div className="flex min-h-[clamp(22rem,58dvh,31rem)] flex-col items-center justify-between px-5 py-5 text-center sm:py-7">
            <div>
              <h2 className="font-serif text-3xl leading-tight text-[#322d42]">Let it<br />flow out</h2>
              <p className="mt-2 text-sm text-[#6f687d]">Speak softly or write one thought.</p>
            </div>
            <div className="grid place-items-center gap-3">
              <CircularActionButton label="Begin voice journal" onClick={startVoice} pressed={listening}>🎙</CircularActionButton>
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="rounded-full border border-white/70 bg-white/76 px-5 py-3 text-sm font-semibold text-[#a77d97] shadow-[0_12px_30px_rgba(152,117,139,0.12)]"
              >
                Write instead
              </button>
            </div>
          </div>
        </SunriseScene>
      ) : (
        <div className="rounded-[1.5rem] border border-white/70 bg-white/76 p-3 shadow-[0_16px_42px_rgba(152,117,139,0.13)] backdrop-blur-2xl sm:p-4 lg:p-5">
          {!embedded ? (
            <div className="mb-3 rounded-[1.25rem] bg-[linear-gradient(180deg,rgba(251,237,232,0.82),rgba(255,255,255,0.62))] p-4 text-center">
              <p className="font-serif text-2xl text-[#322d42]">What wants to be released first?</p>
              <p className="mt-1 text-sm text-[#6f687d]">One honest sentence is enough.</p>
              {listening ? <div className="mx-auto mt-4 h-16 w-36 rounded-[50%] border border-[#98b6d3]/50 animate-ping" /> : null}
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-[#322d42]">{compact ? "What is weighing on you right now?" : "Share what’s here."}</h2>
              <p className="mt-1 text-sm text-[#6f687d]">{compact ? "Share freely. This is your space." : "Review your words before continuing."}</p>
            </div>
            <HelpTooltip label="Microphone information">Speak your thoughts and review the text before continuing. Your voice is converted into text so you can review it before continuing.</HelpTooltip>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#f1d6d0] bg-white/72">
            <div className="flex items-start gap-3 p-3">
              <button
                type="button"
                onClick={listening ? stopVoice : paused ? startVoice : startVoice}
                className={`grid min-h-11 min-w-11 place-items-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-[#d79bb8] ${
                  listening ? "border-[#d79bb8] bg-[#fbedee] text-[#d58e93]" : "border-[#f1d6d0] bg-white text-[#d58e93]"
                }`}
                aria-label="Speak your thoughts"
                aria-pressed={listening}
              >
                🎙
              </button>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write what happened, what you feel, or what you need."
                className="min-h-[9rem] w-full resize-y scroll-mt-24 bg-transparent p-1 text-base leading-6 text-[#322d42] outline-none placeholder:text-[#a99ba9] sm:min-h-32"
              />
            </div>
          </div>

          {listening || paused ? (
            <div className="mt-3 rounded-2xl border border-[#f1d6d0] bg-[#fff8f4]/80 p-3">
              <p className="font-medium text-[#322d42]">{listening ? "Listening…" : "Paused"}</p>
              <p className="mt-1 text-sm text-[#6f687d]">Speak naturally. Your words will appear here.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {listening ? <button type="button" onClick={pauseVoice} className="soft-pill min-h-10 rounded-full px-4 text-sm">Pause</button> : null}
                {paused ? <button type="button" onClick={startVoice} className="soft-pill min-h-10 rounded-full px-4 text-sm">Continue</button> : null}
                <button type="button" onClick={stopVoice} className="soft-pill min-h-10 rounded-full px-4 text-sm">Stop</button>
              </div>
            </div>
          ) : null}

          {voiceUnsupported || voiceError ? <p className="mt-3 rounded-2xl border border-[#f1d6d0] bg-white/72 p-3 text-sm text-[#6f687d]">{voiceError || "Voice input is not available in this browser. You can still type your thoughts."}</p> : null}

          <div className="mt-4">
            <p className="text-sm font-medium text-[#322d42]">What emotion are you experiencing?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {emotionChips.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  className={`min-h-10 rounded-full border px-3 text-sm transition ${
                    selectedEmotions.includes(emotion) ? "border-[#d79bb8] bg-[#fbedee] text-[#a77d97]" : "border-[#f1d6d0] bg-white/70 text-[#6f687d]"
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <GoldButton className="flex-1" disabled={!text.trim()} onClick={() => submit()}>Continue</GoldButton>
            <button
              type="button"
              onClick={() => {
                void submit("I just want a quick reset.");
              }}
              className="min-h-11 rounded-full border border-[#f1d6d0] bg-white px-4 py-2.5 font-semibold text-[#a77d97]"
            >
              Quick reset
            </button>
            <button
              type="button"
              onClick={() => {
                if (text && window.confirm("Remove the words currently written on this screen? Saved reflections will remain safe.")) setText("");
                if (!text) setPanelOpen(false);
              }}
              className="min-h-11 rounded-full border border-[#f1d6d0] bg-white px-4 py-2.5 font-semibold text-[#a77d97]"
              aria-label="Clear Entry"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

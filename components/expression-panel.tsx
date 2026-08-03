"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ChakraProcessingScreen } from "@/components/chakra-processing-screen";
import { HelpTooltip } from "@/components/help-tooltip";
import { GoldButton } from "@/components/mvp-shell";
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

export function ExpressionPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
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

  const submit = async () => {
    if (!text.trim()) {
      setError("Share at least one sentence before continuing.");
      return;
    }
    stopVoice();
    setLoading(true);
    setError("");
    const decoratedText = selectedEmotions.length ? `${text.trim()}\n\nEmotions selected: ${selectedEmotions.join(", ")}` : text.trim();
    const entry = createJournalEntry({
      rawText: decoratedText,
      saveMode: "temporary_analysis",
      emotionalIntensityBefore: 6,
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: decoratedText }),
      });
      const payload = (await response.json()) as { analysis?: EmotionalAnalysis; error?: string };
      if (!response.ok || !payload.analysis) throw new Error(payload.error ?? "Insight failed");
      saveAnalysis(entry.id, payload.analysis);
      savePlan(entry.id);
      window.setTimeout(() => router.push(`/analysis?entry=${entry.id}`), 900);
    } catch {
      setLoading(false);
      setError("We could not prepare your emotional insight right now. Please try again.");
    }
  };

  if (loading) return <ChakraProcessingScreen />;

  return (
    <section className="rounded-[1.5rem] border border-purple-200 bg-white/76 p-4 shadow-[0_18px_42px_rgba(88,28,135,0.12)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-[#130b4f]">{compact ? "What is weighing on you right now?" : "What is happening right now?"}</h2>
          <p className="mt-1 text-sm text-[#4b3f86]">{compact ? "Share what is happening and prepare a personalised reset." : "Share as much or as little as you need."}</p>
        </div>
        <HelpTooltip label="Microphone information">Speak your thoughts and review the text before continuing. Your voice is converted into text so you can review it before continuing.</HelpTooltip>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-purple-200 bg-white/70">
        <div className="flex items-start gap-3 p-3">
          <button
            type="button"
            onClick={listening ? stopVoice : paused ? startVoice : startVoice}
            className={`grid min-h-11 min-w-11 place-items-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] ${
              listening ? "border-purple-400 bg-purple-100 text-[#6d28d9]" : "border-purple-200 bg-white text-[#7c3aed]"
            }`}
            aria-label="Speak your thoughts"
            aria-pressed={listening}
          >
            🎙
          </button>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write or speak freely. Start wherever you are."
            className="min-h-32 w-full resize-y bg-transparent p-1 text-base leading-6 text-[#130b4f] outline-none placeholder:text-[#8f81c2]"
          />
        </div>
      </div>

      {listening || paused ? (
        <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50/80 p-3">
          <p className="font-medium text-[#26156f]">{listening ? "Listening…" : "Paused"}</p>
          <p className="mt-1 text-sm text-[#6d5ea8]">Speak naturally. Your words will appear here.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {listening ? <button type="button" onClick={pauseVoice} className="soft-pill min-h-10 rounded-full px-4 text-sm">Pause</button> : null}
            {paused ? <button type="button" onClick={startVoice} className="soft-pill min-h-10 rounded-full px-4 text-sm">Continue</button> : null}
            <button type="button" onClick={stopVoice} className="soft-pill min-h-10 rounded-full px-4 text-sm">Stop</button>
          </div>
        </div>
      ) : null}

      {voiceUnsupported || voiceError ? <p className="mt-3 rounded-2xl border border-purple-200 bg-white/72 p-3 text-sm text-[#4b3f86]">{voiceError || "Voice input is not available in this browser. You can still type your thoughts."}</p> : null}

      <div className="mt-4">
        <p className="text-sm font-medium text-[#26156f]">What emotion are you experiencing?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {emotionChips.map((emotion) => (
            <button
              key={emotion}
              type="button"
              onClick={() => toggleEmotion(emotion)}
              className={`min-h-10 rounded-full border px-3 text-sm transition ${
                selectedEmotions.includes(emotion) ? "border-purple-400 bg-purple-100 text-[#6d28d9]" : "border-purple-200 bg-white/70 text-[#4b3f86]"
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <GoldButton className="flex-1" onClick={submit}>Help Me Feel Better</GoldButton>
        <button
          type="button"
          onClick={() => {
            if (text && window.confirm("Remove the words currently written on this screen? Saved reflections will remain safe.")) setText("");
          }}
          className="min-h-11 rounded-full border border-purple-200 bg-white px-4 py-2.5 font-semibold text-[#6d28d9]"
          aria-label="Clear Entry"
          title="Remove the words currently written on this screen. Saved reflections will remain safe."
        >
          Clear Entry
        </button>
      </div>
    </section>
  );
}

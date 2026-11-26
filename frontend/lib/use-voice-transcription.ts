"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { toHinglish } from "@/lib/hinglish";
import { speechLanguage as preferredSpeechLanguage, updatePreferences, type SpeechLanguage } from "@/lib/preferences-store";

// Voice → transcription, behind a swappable seam
// (docs/TECHNICAL_ARCHITECTURE.md §11): the remote transcription provider
// is intentionally not locked yet, so this uses the browser's own
// SpeechRecognition — a real, working, zero-vendor mechanism for local
// development, not a mock. Swapping in a remote provider later only means
// replacing this hook's internals; callers just see
// { transcript, listening, start, stop, cancel }. No audio is ever
// captured or stored — only the text results the browser API already
// produces (§11 "original voice recordings are not retained" is satisfied
// by construction, not as cleanup).

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

export type VoiceStatus = "idle" | "listening" | "error" | "unsupported";

export function useVoiceTranscription() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");
  // English or Hindi (shown in English letters), remembered.
  const [language, setLanguageState] = useState<SpeechLanguage>("en");
  const languageRef = useRef<SpeechLanguage>("en");
  useEffect(() => {
    const preferred = preferredSpeechLanguage();
    languageRef.current = preferred;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguageState(preferred);
  }, []);

  const SpeechRecognitionCtor = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") return null;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  }, []);

  const supported = SpeechRecognitionCtor !== null;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const start = () => {
    setError("");
    if (!SpeechRecognitionCtor) {
      setStatus("unsupported");
      setError("Voice input isn't available in this browser. You can type instead.");
      return;
    }
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Indian English; Hindi is heard in Devanagari and shown in English letters.
    const hindi = languageRef.current === "hi";
    recognition.lang = hindi ? "hi-IN" : "en-IN";
    let finalTranscript = "";
    baseRef.current = transcript.trim();

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const heard = event.results[index][0]?.transcript ?? "";
        const chunk = hindi ? toHinglish(heard) : heard;
        if (event.results[index].isFinal) finalTranscript += chunk;
        else interim += chunk;
      }
      const base = baseRef.current;
      const combined = `${finalTranscript}${interim}`.trim();
      setTranscript(combined ? `${base ? `${base} ` : ""}${combined}` : base);
    };

    // A recognition that has since been replaced (stopped, or React's
    // development remount) must not touch the one listening now.
    const current = () => recognitionRef.current === recognition;
    recognition.onerror = (event) => {
      if (!current()) return;
      setStatus("error");
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied. You can type instead."
          : "Voice input stopped unexpectedly. You can type instead.",
      );
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      if (!current()) return;
      recognitionRef.current = null;
      setStatus((current) => (current === "listening" ? "idle" : current));
    };

    try {
      recognitionRef.current = recognition;
      setStatus("listening");
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus("error");
      setError("Voice input couldn't start. You can type instead.");
    }
  };

  // User-initiated stop: keep whatever was transcribed so far.
  const stop = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("idle");
  };

  // User cancels entirely: discard the transcript, back to a clean slate.
  const cancel = () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setTranscript("");
    setStatus("idle");
    setError("");
  };

  // Switching language while listening carries on in the new one, keeping
  // what was already said.
  const setLanguage = (next: SpeechLanguage) => {
    if (next === languageRef.current) return;
    languageRef.current = next;
    setLanguageState(next);
    updatePreferences({ speechLanguage: next });
    if (recognitionRef.current || status === "listening") {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      window.setTimeout(start, 0);
    }
  };

  return { supported, status, transcript, error, setTranscript, start, stop, cancel, language, setLanguage };
}

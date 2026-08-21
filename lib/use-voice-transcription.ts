"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    recognition.lang = "en-US";
    let finalTranscript = "";
    baseRef.current = transcript.trim();

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const chunk = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) finalTranscript += chunk;
        else interim += chunk;
      }
      const base = baseRef.current;
      const combined = `${finalTranscript}${interim}`.trim();
      setTranscript(combined ? `${base ? `${base} ` : ""}${combined}` : base);
    };

    recognition.onerror = (event) => {
      setStatus("error");
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied. You can type instead."
          : "Voice input stopped unexpectedly. You can type instead.",
      );
      recognitionRef.current = null;
    };

    recognition.onend = () => {
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

  return { supported, status, transcript, error, setTranscript, start, stop, cancel };
}

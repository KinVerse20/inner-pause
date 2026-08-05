"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ChakraProcessingScreen } from "@/components/chakra-processing-screen";
import { HelpTooltip } from "@/components/help-tooltip";
import { BlushCard, CircularActionButton, SunriseScene } from "@/components/morning-blush-ui";
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
const journalPrompts = [
  "What’s weighing on me today?",
  "What do I need to let go of?",
  "What would I love to feel?",
];

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
  const [text, setText] = useState("");
  const [panelOpen, setPanelOpen] = useState(initialMode === "write");
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

  const insertPrompt = (prompt: string) => {
    setPanelOpen(true);
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

  return (
    <section className="space-y-3.5">
      {!panelOpen ? (
        <SunriseScene variant="lake">
          <div className="reference-phone-canvas grid gap-5 px-5 py-6 text-center lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:text-left">
            <div className="mx-auto flex max-w-xl flex-col items-center lg:items-start">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">Express</p>
              <h2 className="mt-3 font-serif text-[clamp(2.4rem,8vw,4.6rem)] leading-[0.95] text-[var(--ip-ink)]">Speak freely</h2>
              <p className="mt-3 text-sm text-[var(--ip-body)]">Let your voice become a reflection.</p>
              <div className="relative mt-9 grid place-items-center">
                <div className={`voice-halo ${listening ? "voice-halo--active" : ""}`} />
                <CircularActionButton label="Start speaking" onClick={startVoice} pressed={listening} className="h-28 w-28 text-5xl">
                  ♩
                </CircularActionButton>
              </div>
              <p className="mt-5 font-mono text-sm text-[var(--ip-muted)]">{listening ? "00:12 listening" : paused ? "Paused" : "Tap to begin"}</p>
              <div className="dawn-wave mt-8 h-10 w-full max-w-sm" aria-hidden="true" />
              <div className="mt-5 grid w-full max-w-sm grid-cols-3 gap-2">
                <button type="button" onClick={() => setPanelOpen(true)} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/58 text-sm font-semibold text-[var(--ip-body)]">Cancel</button>
                <button type="button" onClick={listening ? stopVoice : startVoice} className="min-h-11 rounded-full border border-[var(--gold-border)] bg-white/72 text-sm font-semibold text-[var(--gold-light)]">{listening ? "Stop" : "Start"}</button>
                <button type="button" disabled={!text.trim()} onClick={() => submit()} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-[var(--ip-lavender)] text-sm font-semibold text-[var(--gold-light)] disabled:opacity-50">Confirm</button>
              </div>
            </div>

            <BlushCard className="hidden p-4 text-left lg:block">
              <p className="font-serif text-xl text-[var(--ip-ink)]">Expression field</p>
              <div className="mt-4 space-y-3">
                {[
                  ["Expression level", `${Math.round(expressionLevel)}%`],
                  ["Emotional intensity", selectedEmotions.length ? "Active" : "Gentle"],
                  ["Dominant tone", dominantTone],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 rounded-2xl border border-[var(--gold-border-soft)] bg-white/58 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--gold-border-soft)] text-[var(--gold-light)]">✺</span>
                    <div>
                      <p className="text-xs text-[var(--ip-muted)]">{label}</p>
                      <p className="text-sm font-semibold text-[var(--ip-ink)]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dawn-wave mt-5 h-10 w-full" aria-hidden="true" />
            </BlushCard>
          </div>
        </SunriseScene>
      ) : (
        <SunriseScene>
          <div className="grid min-h-[clamp(30rem,70dvh,34rem)] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:p-6">
            <div className="flex min-w-0 flex-col">
              {!embedded ? (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold-light)]">Vibrational query</p>
                  <h2 className="mt-2 font-serif text-[clamp(2rem,7vw,3.6rem)] leading-tight text-[var(--ip-ink)]">{compact ? "Write softly" : "Write freely"}</h2>
                  <p className="mt-1 text-sm text-[var(--ip-body)]">One honest line is enough.</p>
                </div>
              ) : null}

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.1rem] border border-[var(--gold-border-soft)] bg-white/60">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Start writing what’s on your mind..."
                  className="min-h-[13rem] flex-1 resize-none bg-transparent p-4 text-base leading-7 text-[var(--ip-ink)] outline-none placeholder:text-[rgba(110,86,143,0.52)] sm:min-h-[18rem]"
                />
                <div className="flex min-h-12 items-center justify-between gap-3 border-t border-[var(--gold-border-soft)] px-3 text-xs text-[var(--ip-muted)]">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => insertPrompt(journalPrompts[0])} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/70" aria-label="Insert prompt">▣</button>
                    <button type="button" onClick={startVoice} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/70" aria-label="Use microphone">♩</button>
                    {listening || paused ? (
                      <>
                        {listening ? <button type="button" onClick={pauseVoice} className="min-h-9 rounded-full px-3 text-xs text-[var(--gold-light)]">Pause</button> : null}
                        {paused ? <button type="button" onClick={startVoice} className="min-h-9 rounded-full px-3 text-xs text-[var(--gold-light)]">Continue</button> : null}
                        <button type="button" onClick={stopVoice} className="min-h-9 rounded-full px-3 text-xs text-[var(--gold-light)]">Stop</button>
                      </>
                    ) : null}
                  </div>
                  <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>

              {voiceUnsupported || voiceError ? <p className="mt-3 rounded-2xl border border-[var(--gold-border-soft)] bg-white/64 p-3 text-sm text-[var(--ip-body)]">{voiceError || "Voice input is not available in this browser. You can still type your thoughts."}</p> : null}

              <div className="mt-4">
                <p className="text-sm font-medium text-[var(--ip-ink)]">Or pick a state</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {emotionChips.map((emotion) => (
                    <button key={emotion} type="button" onClick={() => toggleEmotion(emotion)} className={`min-h-10 rounded-full border px-3 text-sm transition ${selectedEmotions.includes(emotion) ? "border-[var(--gold-border)] bg-[var(--ip-lavender)] text-[var(--gold-light)]" : "border-[var(--gold-border-soft)] bg-white/58 text-[var(--ip-body)]"}`}>
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>

              {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <GoldButton className="flex-1" disabled={!text.trim()} onClick={() => submit()}>Analyze My Vibration</GoldButton>
                <button type="button" onClick={() => void submit("I just want a quick reset.")} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/64 px-4 py-2.5 font-semibold text-[var(--ip-body)]">Quick reset</button>
                <button type="button" onClick={() => { if (text && window.confirm("Remove the words currently written on this screen? Saved reflections will remain safe.")) setText(""); if (!text) setPanelOpen(false); }} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/64 px-4 py-2.5 font-semibold text-[var(--ip-body)]">Clear</button>
              </div>
            </div>

            <BlushCard className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-[var(--ip-ink)]">Journal prompts</h3>
                <HelpTooltip label="Journal prompt information">Prompts are optional. They only add text to your writing area.</HelpTooltip>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
                {journalPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => insertPrompt(prompt)} className="min-h-11 min-w-[13rem] rounded-full border border-[var(--gold-border-soft)] bg-white/58 px-4 text-left text-sm text-[var(--ip-body)] lg:min-w-0">
                    {prompt}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => insertPrompt(journalPrompts[Math.floor(Math.random() * journalPrompts.length)])} className="mt-3 min-h-11 w-full rounded-full border border-[var(--gold-border-soft)] bg-white/58 text-sm text-[var(--gold-light)]">
                Shuffle prompt
              </button>
            </BlushCard>
          </div>
        </SunriseScene>
      )}
    </section>
  );
}

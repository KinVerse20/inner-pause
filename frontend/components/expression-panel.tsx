"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ChakraProcessingScreen } from "@/components/chakra-processing-screen";
import { RitualBackdrop, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { BreathingRipple } from "@/components/ritual-motion-visuals";
import { createFrontendApiClient } from "@/lib/auth/session";
import { expressionActions, type ExpressionActionDefinition, type ExpressionActionId } from "@/lib/expression-actions";
import { createJournalEntry, saveAnalysis, savePlan } from "@/lib/mvp-storage";
import type { EmotionalAnalysis } from "@/lib/mvp-types";

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

export function ExpressionPanel({ initialMode = "speak" }: { initialMode?: "speak" | "write" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"speak" | "write">(initialMode);
  const [text, setText] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeInfo, setActiveInfo] = useState<ExpressionActionId | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [draftForWitness, setDraftForWitness] = useState("");
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

  useEffect(() => {
    if (!activeInfo) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveInfo(null);
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [activeInfo]);

  const startVoice = () => {
    setMode("speak");
    setVoiceError("");
    setNotice("");
    if (!SpeechRecognition) {
      setVoiceUnsupported(true);
      setVoiceError("Voice input is not available here. You can continue by writing instead.");
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
      setVoiceError(event.error === "not-allowed" ? "Microphone access was denied. You can continue by writing instead." : "Voice input paused. You can still keep going.");
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
      setVoiceError("Voice input could not start. You can continue by writing instead.");
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const decoratedText = () => selectedEmotions.length
    ? `${text.trim()}\n\nEmotions selected: ${selectedEmotions.join(", ")}`
    : text.trim();

  const validateText = () => {
    if (text.trim()) return true;
    setNotice("");
    setError("Share at least one sentence before continuing.");
    return false;
  };

  const submit = async () => {
    if (!validateText()) return;

    stopVoice();
    setLoading(true);
    setError("");
    setNotice("");
    const reflection = decoratedText();
    setDraftForWitness(reflection);

    const entry = createJournalEntry({
      rawText: reflection,
      saveMode: "temporary_analysis",
      emotionalIntensityBefore: 6,
    });

    try {
      const api = createFrontendApiClient();
      const payload = (await api.analyseText(reflection)) as { analysis?: EmotionalAnalysis };
      if (!payload.analysis) throw new Error("Insight failed");
      saveAnalysis(entry.id, payload.analysis);
      savePlan(entry.id);
      window.setTimeout(() => router.push(`/analysis?entry=${entry.id}`), 1400);
    } catch (caught) {
      setLoading(false);
      setError(caught instanceof Error ? caught.message : "We could not prepare your emotional insight right now.");
    }
  };

  const savePrivate = () => {
    if (!validateText()) return;
    stopVoice();
    createJournalEntry({
      rawText: decoratedText(),
      saveMode: "journal_without_analysis",
      emotionalIntensityBefore: 6,
    });
    setError("");
    setNotice("Saved as a private release. You can return to it in your logs.");
  };

  const startOver = () => {
    stopVoice();
    setText("");
    setSelectedEmotions([]);
    setVoiceError("");
    setError("");
    setNotice("");
    setElapsed(0);
  };

  const switchMode = (nextMode: "speak" | "write") => {
    if (nextMode === mode) return;
    if (listening) stopVoice();
    setMode(nextMode);
    setVoiceError("");
  };

  const insertPrompt = () => {
    const prompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    setText((current) => (current.trim() ? `${current.trim()}\n\n${prompt}\n` : `${prompt}\n`));
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((current) => (current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion]));
  };

  const tone = inferWeatherTone(`${selectedEmotions.join(" ")} ${text.slice(0, 180)}`);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const timerText = `${Math.floor(elapsed / 60)}:${`${elapsed % 60}`.padStart(2, "0")}`;

  if (loading) {
    return <ChakraProcessingScreen draftText={draftForWitness || text} selectedEmotions={selectedEmotions} />;
  }

  return (
    <div className="journal-motion-flow">
      <RitualBackdrop tone={tone} className="expression-screen">
        <div className="expression-layout">
          <header className="expression-heading journal-prompt-enter">
            <h2>{mode === "write" ? "Write to release" : "Speak to release"}</h2>
            <p>{mode === "write" ? "Let it out gently" : "Say it out gently"}</p>
          </header>

          <p className="expression-words-label">Words gathered so far</p>

          <div className="expression-ripple-stage journal-input-enter">
            <BreathingRipple
              className="expression-ripple"
              label=""
              active={mode === "write" || listening}
            />
            <div className="expression-input-card">
              <textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setError("");
                  setNotice("");
                }}
                placeholder={mode === "write" ? "Start writing what’s on your mind..." : "Your words will gather here as you speak..."}
                aria-label={mode === "write" ? "Write your reflection" : "Voice transcript"}
              />
              <div className="expression-input-footer">
                <span>{mode === "speak" && listening ? timerText : `${words} ${words === 1 ? "word" : "words"}`}</span>
                {mode === "speak" ? (
                  <button type="button" onClick={listening ? stopVoice : startVoice}>
                    <span aria-hidden="true">♩</span>
                    {listening ? "Finish" : "Start speaking"}
                  </button>
                ) : (
                  <button type="button" onClick={insertPrompt}>Add a prompt</button>
                )}
              </div>
            </div>
          </div>

          <div className="expression-mode-toggle" aria-label="Expression mode">
            <button type="button" aria-pressed={mode === "speak"} onClick={() => switchMode("speak")}>
              <span aria-hidden="true">♩</span> Speak
            </button>
            <button type="button" aria-pressed={mode === "write"} onClick={() => switchMode("write")}>
              <span aria-hidden="true">✎</span> Write
            </button>
          </div>

          <div className="expression-actions">
            <ExpressionAction
              definition={expressionActions.insight}
              emphasis="primary"
              onAction={submit}
              onInfo={() => setActiveInfo("insight")}
            />
            <ExpressionAction
              definition={expressionActions.private}
              emphasis="secondary"
              onAction={savePrivate}
              onInfo={() => setActiveInfo("private")}
            />
            <ExpressionAction
              definition={expressionActions.reset}
              emphasis="tertiary"
              onAction={startOver}
              onInfo={() => setActiveInfo("reset")}
            />
          </div>

          {voiceUnsupported || voiceError || error || notice ? (
            <div className={`expression-message ${notice ? "is-success" : ""}`} role={notice ? "status" : "alert"}>
              {notice || voiceError || error || "Voice input is not available here."}
            </div>
          ) : null}

          <details className="expression-emotions">
            <summary>Add how it feels <span>(optional)</span></summary>
            <div>
              {emotionChips.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  aria-pressed={selectedEmotions.includes(emotion)}
                  onClick={() => toggleEmotion(emotion)}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </details>
        </div>
      </RitualBackdrop>

      {activeInfo ? (
        <ExpressionInfoPopover
          definition={expressionActions[activeInfo]}
          onDismiss={() => setActiveInfo(null)}
        />
      ) : null}
    </div>
  );
}

function ExpressionAction({
  definition,
  emphasis,
  onAction,
  onInfo,
}: {
  definition: ExpressionActionDefinition;
  emphasis: "primary" | "secondary" | "tertiary";
  onAction: () => void;
  onInfo: () => void;
}) {
  const descriptionId = `expression-action-${definition.id}`;
  return (
    <div className={`expression-action-row is-${emphasis}`}>
      <button type="button" className="expression-action-button" onClick={onAction} aria-describedby={descriptionId}>
        <span className="expression-action-button__icon" aria-hidden="true">
          {definition.id === "insight" ? "✦" : definition.id === "private" ? "▢" : "↶"}
        </span>
        <span>{definition.label}</span>
      </button>
      <button
        type="button"
        className="expression-info-button"
        onClick={onInfo}
        aria-label={`About ${definition.label}`}
        aria-describedby={descriptionId}
      >
        i
      </button>
      <div id={descriptionId} role="tooltip" className="expression-action-tooltip">
        <strong>{definition.label}</strong>
        <span>{definition.text}</span>
      </div>
    </div>
  );
}

function ExpressionInfoPopover({
  definition,
  onDismiss,
}: {
  definition: ExpressionActionDefinition;
  onDismiss: () => void;
}) {
  return (
    <div className="expression-info-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onDismiss();
    }}>
      <section className="expression-info-sheet" role="dialog" aria-modal="true" aria-labelledby="expression-info-title">
        <button type="button" className="expression-info-close" onClick={onDismiss} aria-label="Close explanation">×</button>
        <p className="minimal-label">What this does</p>
        <h3 id="expression-info-title">{definition.label}</h3>
        <p>{definition.text}</p>
        <ul>
          {definition.points.map((point) => <li key={point}>{point}</li>)}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MvpShell } from "@/components/mvp-shell";
import { RitualBackdrop, RitualOrb, inferWeatherTone } from "@/components/inner-world-ritual-ui";
import { chakraMap } from "@/data/chakras";
import {
  chakraSoundStyles,
  getChakraAudioPath,
  getChakraSoundStyleLabel,
  type ChakraSoundStyle,
} from "@/lib/chakra-audio";
import { updatePlan } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${`${seconds % 60}`.padStart(2, "0")}`;
};

const ritualStages = [
  { key: "release", label: "Release", copy: "Let the held intensity move outward." },
  { key: "breathe", label: "Breathe", copy: "Follow the body back into rhythm." },
  { key: "restore", label: "Restore", copy: "Warm steadiness returns to the center." },
  { key: "integrate", label: "Integrate", copy: "Let the whole scene become quieter and balanced." },
] as const;

function prepareAndPlayAudio(audio: HTMLAudioElement, audioPath: string, shouldLoad: boolean) {
  if (shouldLoad) {
    audio.src = audioPath;
    audio.loop = true;
    audio.currentTime = 0;
    audio.load();
  }

  return audio.play();
}

export function HealingAudioPlayerScreen() {
  const router = useRouter();
  const planId = useSearchParams().get("plan");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.plan?.id === planId);
  const plan = entry?.plan;
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedAudioPathRef = useRef<string | null>(null);
  const [blockIndex, setBlockIndex] = useState(plan?.lastPlaybackPosition.blockIndex ?? 0);
  const [elapsedInBlock, setElapsedInBlock] = useState(plan?.lastPlaybackPosition.elapsedSeconds ?? 0);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [playbackNotice, setPlaybackNotice] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundStyle, setSoundStyle] = useState<ChakraSoundStyle | null>(null);
  const [draftSoundStyle, setDraftSoundStyle] = useState<ChakraSoundStyle | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [soundPickerOpen, setSoundPickerOpen] = useState(true);

  const block = plan?.blocks[blockIndex];
  const chakra = block ? chakraMap[block.chakraId] : null;
  const selectedChakras = plan
    ? [...new Set(plan.blocks.map((item) => item.chakraId))].map((chakraId) => chakraMap[chakraId])
    : [];
  const activeAudioPath = block && soundStyle ? getChakraAudioPath(block.chakraId, soundStyle) : null;
  const totalElapsed = !plan
    ? 0
    : plan.blocks.slice(0, blockIndex).reduce((sum, item) => sum + item.durationMinutes * 60, 0) + elapsedInBlock;
  const totalSeconds = plan?.totalDurationMinutes ? plan.totalDurationMinutes * 60 : 0;
  const remaining = Math.max(totalSeconds - totalElapsed, 0);
  const progress = totalSeconds ? totalElapsed / totalSeconds : 0;
  const stageIndex = Math.min(ritualStages.length - 1, Math.floor(progress * ritualStages.length));
  const stage = ritualStages[stageIndex];
  const tone = inferWeatherTone(`${entry?.analysis?.emotions.map((item) => item.name).join(" ")} ${entry?.analysis?.summary ?? ""}`);

  useEffect(() => {
    if (!plan?.id) return;
    updatePlan(plan.id, { status: "started", lastPlaybackPosition: { blockIndex, elapsedSeconds: elapsedInBlock } });
  }, [blockIndex, elapsedInBlock, plan?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!sessionStarted || !activeAudioPath || loadedAudioPathRef.current === activeAudioPath) return;
    const audio = audioRef.current;
    if (!audio) return;

    loadedAudioPathRef.current = activeAudioPath;
    setAudioError(false);
    setPlaybackNotice(null);
    prepareAndPlayAudio(audio, activeAudioPath, true).then(() => setPlaying(true)).catch(() => {
      setPlaying(false);
      setPlaybackNotice("The sound is ready. Tap play when you are ready to begin.");
    });
  }, [activeAudioPath, sessionStarted]);

  useEffect(() => {
    if (!playing || !block || !plan) return;
    const timer = window.setInterval(() => {
      setElapsedInBlock((current) => {
        const next = current + 1;
        if (next >= block.durationMinutes * 60) {
          if (blockIndex < plan.blocks.length - 1) {
            setBlockIndex((index) => index + 1);
            return 0;
          }
          window.clearInterval(timer);
          router.push(`/feedback?plan=${plan.id}`);
          return next;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [block, blockIndex, plan, playing, router]);

  if (!plan || !block || !chakra) {
    return (
      <MvpShell hideNav>
        <div className="mx-auto max-w-xl rounded-[1.45rem] border border-white/10 bg-[rgba(17,18,20,0.66)] p-6">
          <p className="text-[var(--ip-body)]">No active healing session found.</p>
          <button
            type="button"
            onClick={() => router.replace("/healing")}
            className="mt-5 min-h-11 rounded-full border border-[rgba(244,122,34,0.45)] bg-[rgba(244,122,34,0.1)] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)]"
          >
            Open healing
          </button>
        </div>
      </MvpShell>
    );
  }

  const toggle = () => {
    if (!audioRef.current || audioError) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    audioRef.current.play().then(() => {
      setPlaying(true);
      setPlaybackNotice(null);
    }).catch(() => {
      setPlaying(false);
      setPlaybackNotice("This sound could not start. Please try again.");
    });
  };

  const goToBlock = (index: number) => {
    if (!plan || index < 0 || index >= plan.blocks.length) return;
    setBlockIndex(index);
    setElapsedInBlock(0);
  };

  const applySoundStyle = () => {
    if (!draftSoundStyle || !block) return;
    const audioPath = getChakraAudioPath(block.chakraId, draftSoundStyle);
    setSoundStyle(draftSoundStyle);
    setSessionStarted(true);
    setSoundPickerOpen(false);
    setAudioError(false);
    setPlaybackNotice(null);

    if (audioRef.current) {
      loadedAudioPathRef.current = audioPath;
      prepareAndPlayAudio(audioRef.current, audioPath, true).then(() => setPlaying(true)).catch(() => {
        setPlaying(false);
        setPlaybackNotice("The sound is ready. Tap play when you are ready to begin.");
      });
    }
  };

  return (
    <MvpShell hideNav>
      <RitualBackdrop tone={tone} className="min-h-dvh rounded-none border-0 px-4 py-[calc(0.9rem+env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-1.8rem)] max-w-6xl flex-col">
          <header className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => router.push(`/healing?entry=${entry?.id}`)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-2xl text-[var(--ip-body)]" aria-label="Exit safely">
              ‹
            </button>
            <div className="text-center">
              <p className="minimal-label text-xs">Heal</p>
              <h1 className="mt-2 font-serif text-[clamp(2rem,5vw,4rem)] text-[var(--ip-ink)]">{chakra.name.replace(" Chakra", "")}</h1>
              <p className="text-sm text-[var(--ip-body)]">{stage.label} • {block.frequencyLabel}</p>
              {soundStyle ? <p className="mt-1 text-xs text-[var(--gold-light)]">{getChakraSoundStyleLabel(soundStyle)}</p> : null}
            </div>
            <button type="button" onClick={() => router.push(`/feedback?plan=${plan.id}`)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-[var(--ip-body)]" aria-label="End session">
              ≡
            </button>
          </header>

          <div className="grid flex-1 gap-6 py-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-center lg:gap-8">
            <div className="hidden lg:block">
              <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(11,15,33,0.46)] p-4 backdrop-blur-xl">
                <p className="minimal-label text-[0.62rem]">Healing stages</p>
                <div className="mt-4 grid gap-3">
                  {ritualStages.map((item, index) => (
                    <div key={item.key} className={`flex items-start gap-3 ${index === stageIndex ? "text-[var(--gold-light)]" : "text-[var(--ip-body)]"}`}>
                      <span className={`mt-1 h-9 w-9 rounded-full border ${index === stageIndex ? "border-[rgba(244,122,34,0.5)] bg-[rgba(244,122,34,0.1)]" : "border-white/10 bg-white/[0.035]"}`} />
                      <div>
                        <p className="font-serif text-[1.55rem] leading-none">{item.label}</p>
                        <p className="mt-2 text-sm leading-6">{item.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid place-items-center gap-5">
              <RitualOrb
                stage={reducedMotion ? "integrate" : stage.key}
                tone={tone}
                active={playing}
                intensity={Math.max(0.45, 0.5 + progress * 0.45)}
                label={`${stage.label} ritual orb`}
                className="w-[min(82vw,30rem)] lg:w-[min(40vw,32rem)]"
              />
              <div className="max-w-xl text-center">
                <p className="minimal-label text-[0.68rem]">{stage.label}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--ip-body)]">
                  {block.guidanceText ?? stage.copy}
                </p>
              </div>

              <div className="w-full max-w-3xl rounded-[1.7rem] border border-white/10 bg-[rgba(11,15,33,0.5)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-5">
                <div className="h-1 overflow-hidden rounded-full bg-white/12">
                  <div className="h-full rounded-full bg-[var(--gold-primary)] shadow-[0_0_14px_rgba(255,122,34,0.8)]" style={{ width: `${progress * 100}%` }} />
                </div>

                <div className="mt-3 flex items-center justify-between text-lg text-[var(--ip-body)]">
                  <span>{formatTime(totalElapsed)}</span>
                  <span>{formatTime(remaining)}</span>
                </div>

                {audioError ? (
                  <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                    This {chakra.name} {soundStyle ? getChakraSoundStyleLabel(soundStyle) : "audio"} file is unavailable. Choose another sound or check the matching file in public/audio/chakras/{chakra.frequencyLabel.replace(" Hz", "")}.
                  </p>
                ) : null}

                {playbackNotice && !audioError ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm text-[var(--ip-body)]">
                    {playbackNotice}
                  </p>
                ) : null}

                <div className="mt-5 grid grid-cols-5 items-center gap-2">
                  <button type="button" disabled={blockIndex === 0} onClick={() => goToBlock(blockIndex - 1)} className="grid min-h-11 place-items-center rounded-full text-2xl text-[var(--ip-body)] disabled:opacity-35" aria-label="Previous block">
                    ‹
                  </button>
                  <button type="button" onClick={() => setElapsedInBlock(0)} className="min-h-11 rounded-full text-[0.68rem] uppercase tracking-[0.18em] text-[var(--ip-body)]">
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={toggle}
                    disabled={audioError}
                    className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[rgba(244,122,34,0.52)] bg-[rgba(244,122,34,0.12)] text-3xl text-[var(--gold-light)] shadow-[0_0_36px_rgba(244,122,34,0.18)] disabled:opacity-45"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? "Ⅱ" : "▶"}
                  </button>
                  <button type="button" onClick={() => router.push(`/feedback?plan=${plan.id}`)} className="min-h-11 rounded-full text-[0.68rem] uppercase tracking-[0.18em] text-[var(--ip-body)]">
                    End session
                  </button>
                  <button type="button" disabled={blockIndex === plan.blocks.length - 1} onClick={() => goToBlock(blockIndex + 1)} className="grid min-h-11 place-items-center rounded-full text-2xl text-[var(--ip-body)] disabled:opacity-35" aria-label="Next block">
                    ›
                  </button>
                </div>

                <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-[rgba(17,18,20,0.4)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="minimal-label text-[0.62rem]">Current block</p>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftSoundStyle(soundStyle);
                        setSoundPickerOpen(true);
                      }}
                      className="min-h-10 rounded-full border border-white/10 bg-white/[0.035] px-4 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-[var(--gold-light)]"
                    >
                      Change sound
                    </button>
                  </div>
                  <p className="mt-2 font-serif text-2xl text-[var(--ip-ink)]">{block.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--ip-body)]">{block.intention}</p>
                </div>

                <div className={`ritual-waveform mt-5 ${!playing ? "is-paused" : ""}`} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
        {soundPickerOpen ? (
          <div className="absolute inset-0 z-30 grid min-h-dvh place-items-center overflow-y-auto bg-[rgba(6,10,24,0.9)] px-4 py-[calc(1.25rem+env(safe-area-inset-top))] backdrop-blur-xl">
            <section className="w-full max-w-2xl rounded-[1.8rem] border border-[rgba(244,122,34,0.28)] bg-[rgba(11,15,33,0.94)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:p-7" aria-labelledby="sound-picker-title">
              <p className="minimal-label text-xs">Your healing sound</p>
              <h2 id="sound-picker-title" className="mt-3 font-serif text-[clamp(2.3rem,7vw,4rem)] leading-none text-[var(--ip-ink)]">
                What would you like to listen to?
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--ip-body)]">
                Choose once for this session. The same sound will follow {selectedChakras.length > 1 ? "each selected chakra" : "your selected chakra"} at its correct frequency.
              </p>

              <div className="mt-5 flex flex-wrap gap-2" aria-label="Selected chakra frequencies">
                {selectedChakras.map((item) => (
                  <span key={item.id} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-[var(--ip-body)]">
                    {item.name.replace(" Chakra", "")} · {item.frequencyLabel}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {chakraSoundStyles.map((style) => {
                  const selected = draftSoundStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setDraftSoundStyle(style.id)}
                      className={`min-h-16 rounded-[1.2rem] border px-4 text-left transition ${selected ? "border-[rgba(244,122,34,0.72)] bg-[rgba(244,122,34,0.16)] text-[var(--gold-light)]" : "border-white/10 bg-white/[0.035] text-[var(--ip-body)] hover:border-white/20 hover:bg-white/[0.06]"}`}
                    >
                      <span className="font-serif text-xl sm:text-2xl">{style.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                {sessionStarted ? (
                  <button type="button" onClick={() => setSoundPickerOpen(false)} className="min-h-12 rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ip-body)]">
                    Keep current sound
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={!draftSoundStyle}
                  onClick={applySoundStyle}
                  className="min-h-12 rounded-full border border-[rgba(244,122,34,0.58)] bg-[rgba(244,122,34,0.14)] px-6 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold-light)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sessionStarted ? "Apply sound" : "Begin healing"}
                </button>
              </div>
            </section>
          </div>
        ) : null}
        <audio
          ref={audioRef}
          preload="auto"
          onError={() => {
            setAudioError(true);
            setPlaying(false);
            setPlaybackNotice(null);
          }}
        />
      </RitualBackdrop>
    </MvpShell>
  );
}

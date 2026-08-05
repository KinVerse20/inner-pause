"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChakraGlyph } from "@/components/chakra-symbol";
import { GlassCard, GoldButton, MvpShell } from "@/components/mvp-shell";
import { chakraMap } from "@/data/chakras";
import { updatePlan } from "@/lib/mvp-storage";
import { useMvpState } from "@/lib/use-mvp-state";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${`${seconds % 60}`.padStart(2, "0")}`;
};

export function HealingAudioPlayerScreen() {
  const router = useRouter();
  const planId = useSearchParams().get("plan");
  const state = useMvpState();
  const entry = state.entries.find((item) => item.plan?.id === planId);
  const plan = entry?.plan;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [blockIndex, setBlockIndex] = useState(plan?.lastPlaybackPosition.blockIndex ?? 0);
  const [elapsedInBlock, setElapsedInBlock] = useState(plan?.lastPlaybackPosition.elapsedSeconds ?? 0);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [guidanceOn, setGuidanceOn] = useState(true);
  const [musicOnly, setMusicOnly] = useState(false);

  const block = plan?.blocks[blockIndex];
  const chakra = block ? chakraMap[block.chakraId] : null;
  const voiceGuidanceOff = plan?.customisation?.voiceGuidanceLevel === "none";
  const showGuidance = guidanceOn && !musicOnly && !voiceGuidanceOff;
  const totalElapsed = useMemo(() => {
    if (!plan) return 0;
    return plan.blocks.slice(0, blockIndex).reduce((sum, item) => sum + item.durationMinutes * 60, 0) + elapsedInBlock;
  }, [blockIndex, elapsedInBlock, plan]);
  const totalSeconds = plan?.totalDurationMinutes ? plan.totalDurationMinutes * 60 : 0;
  const remaining = Math.max(totalSeconds - totalElapsed, 0);

  useEffect(() => {
    if (!plan?.id) return;
    updatePlan(plan.id, { status: "started", lastPlaybackPosition: { blockIndex, elapsedSeconds: elapsedInBlock } });
  }, [blockIndex, elapsedInBlock, plan?.id]);

  useEffect(() => {
    if (!audioRef.current || !block) return;
    audioRef.current.src = block.audioPath;
    audioRef.current.loop = true;
    audioRef.current.currentTime = 0;
    setAudioError(false);
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {
      setAudioError(true);
      setPlaying(false);
    });
  }, [block]);

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
        <GlassCard className="mx-auto max-w-xl p-6">
          <p className="text-[var(--ip-body)]">No active healing session found.</p>
          <GoldButton className="mt-5" onClick={() => router.replace("/healing")}>Open Healing</GoldButton>
        </GlassCard>
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
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setAudioError(true));
  };

  const goToBlock = (index: number) => {
    if (index < 0 || index >= plan.blocks.length) return;
    setBlockIndex(index);
    setElapsedInBlock(0);
  };

  return (
    <MvpShell hideNav>
      <div
        className="relative min-h-dvh overflow-x-hidden px-0 pb-[calc(1rem+env(safe-area-inset-bottom))] text-[var(--cream)]"
        style={{ background: `radial-gradient(circle at 50% 36%, ${chakra.color}34, transparent 32%), radial-gradient(circle at 50% 0%, rgba(240,206,160,0.2), transparent 22rem), linear-gradient(180deg,#07142f,#0d1a3a 56%,#07142f)` }}
      >
        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-3.5 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <header className="flex items-center justify-between">
            <button type="button" onClick={() => router.push(`/healing?entry=${entry?.id}`)} className="grid h-10 w-10 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-[var(--gold-light)]" aria-label="Exit safely">⌄</button>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold-primary)]">{block.frequencyLabel}</p>
              <h1 className="font-serif text-2xl text-[var(--cream)]">You are safe here.</h1>
              <p className="text-xs text-[var(--ip-body)]">{block.title}</p>
            </div>
            <button
              type="button"
              onClick={() => window.alert("Audio settings are using the current session defaults in this demo build.")}
              className="grid h-10 w-10 place-items-center rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-[var(--gold-light)]"
              aria-label="Audio settings"
            >
              ≛
            </button>
          </header>

          <div className="grid flex-1 place-items-center py-4">
            <div className="relative grid aspect-square w-[min(70vw,21rem)] place-items-center">
              <div className="absolute inset-0 rounded-full border border-[var(--gold-border)] mvp-orb" />
              <div className="absolute inset-8 rounded-full border border-[var(--gold-border-soft)]" />
              <ChakraGlyph chakraId={chakra.id} className="relative z-10 h-28 w-28" />
              <div className="absolute bottom-6 rounded-full border border-[var(--gold-border-soft)] bg-[#111e41]/72 px-3 py-1.5 text-xs text-[var(--ip-body)] backdrop-blur-xl">
                {showGuidance ? block.guidanceText ?? "Breathe slowly" : "Music only"}
              </div>
            </div>
          </div>

          <GlassCard className="p-3.5">
            <p className="text-sm text-[var(--gold-muted)]">Emotional intention</p>
            <p className="mt-1 line-clamp-1 font-serif text-xl text-[var(--cream)]">{block.intention}</p>
            {plan.customisation ? (
              <p className="mt-1 text-xs text-[var(--ip-body)]">
                {plan.customisation.musicStyle.replaceAll("-", " ")} • {voiceGuidanceOff ? "no voice guidance" : `${plan.customisation.voiceGuidanceLevel} guidance`}
              </p>
            ) : null}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-[#f6dfc1] to-[#e9b5be]" style={{ width: `${totalSeconds ? (totalElapsed / totalSeconds) * 100 : 0}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm text-[var(--ip-body)]">
              <span>{formatTime(totalElapsed)}</span>
              <span>{formatTime(remaining)}</span>
            </div>

            {audioError ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Add the MP3 file to the public/audio folder or replace placeholder audio with licensed production audio.
              </p>
            ) : null}

            <div className="mt-3 grid grid-cols-5 items-center gap-2">
              <button
                type="button"
                disabled={blockIndex === 0}
                onClick={() => goToBlock(blockIndex - 1)}
                className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-[var(--gold-light)] disabled:opacity-35"
                aria-label="Previous block"
              >
                ‹
              </button>
              <button type="button" disabled={voiceGuidanceOff} onClick={() => setGuidanceOn((value) => !value)} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-xs text-[var(--ip-body)] disabled:opacity-35">{voiceGuidanceOff ? "No voice" : guidanceOn ? "Guide" : "Silent"}</button>
              <button type="button" onClick={toggle} className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[var(--gold-border)] bg-[linear-gradient(135deg,#f6dfc1,#ddb27b)] text-sm font-semibold text-[#07142f]">
                {playing ? "Pause" : "Play"}
              </button>
              <button type="button" onClick={() => setMusicOnly((value) => !value)} className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-xs text-[var(--ip-body)]">{musicOnly ? "Music" : "Mixed"}</button>
              <button
                type="button"
                disabled={blockIndex === plan.blocks.length - 1}
                onClick={() => goToBlock(blockIndex + 1)}
                className="min-h-11 rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-[var(--gold-light)] disabled:opacity-35"
                aria-label="Next block"
              >
                ›
              </button>
            </div>
            <button type="button" onClick={() => router.push(`/feedback?plan=${plan.id}`)} className="mt-3 min-h-11 w-full rounded-full border border-[var(--gold-border-soft)] bg-white/8 text-sm text-[var(--ip-body)]">
              Exit safely
            </button>
          </GlassCard>
        </div>
        <audio ref={audioRef} preload="auto" onError={() => setAudioError(true)} />
      </div>
    </MvpShell>
  );
}
